/*
 * This script collects and manages all data for a content objects
 */
var step     = require('./step');
    sketchup = require('./sketchup');
    modeldb  = require('./modeldb');
    dbpedia  = require('./dbpedia');
    flickr   = require('./flickr');
    youtube  = require('./youtube'),
    sound    = require('./freesound'),
    weather  = require('./wunderground');

var Fetch = function() {	
};  

Fetch.prototype.getPart = function(type, query, callback) {
	
	if(callback && (!type || !query)) {
		callback('Missing parameter', []);
	}
	
	var handleResult = function(error,data) {
		//Be sure to have data before going on
		if(!error && data.length < 1) {
			error = 'No data could be retrieved.';
		}
		if(error) {
			callback('error: ' + error,[]);
		}
		
		callback(null,data);
	};
	
	switch(type) {
		case '3d':
			step(
				function init() {
					//Fetch 3d model data
					sketchup.fetchThreed(query, this);
				},
				function getResult(error,data) {
					//Be sure to have data before going on
					if(!error && data.length < 1) {
						error = 'No data could be retrieved.';
					}
					if(error) {
						console.log('error: ' + error);
						callback(error,[]);
					}
					callback(null,data);
				}
			);
			break;
		case 'text':
			step(
				function init() {
					//Fetch free text data for the model
					dbpedia.fetchText(query, '', this);
				},
				function getResult(error,data) {
					//Be sure to have data before going on
					if(!error && data.length < 1) {
						error = 'No data could be retrieved.';
					}
					if(error) {
						console.log('error: ' + error);
						callback(error,[]);
					}
					callback(null,data);
				}
			);
			break;
		case 'image':
			step(
				function init() {
					//Fetch images for the given query
					flickr.fetchImage(query,0,this);
				},
				function getWeather(error,data) {
					//Be sure to have data before going on
					if(!error && data.length < 1) {
						error = 'No data could be retrieved.';
					}
					if(error) {
						console.log('error: ' + error);
						callback(error,[]);
					}
					weather.fetchWeather(data,this);
				},
				function getResult(error,data) {
					//Be sure to have data before going on
					if(!error && data.length < 1) {
						error = 'No data could be retrieved.';
					}
					if(error) {
						console.log('error: ' + error);
						callback(error,[]);
					}
					
					var result = [];
					for(var w=0; w < data.length; w++) {
						result.push(data[w][0]);
					}
					
					callback(null,result);
				}
			);
			break;
		case 'video':
			step(
				function init() {
					//Get videos for the given query
					youtube.fetchVideo(query,this);
				},
				function getResult(error,data) {
					//Be sure to have data before going on
					if(!error && data.length < 1) {
						error = 'No data could be retrieved.';
					}
					if(error) {
						console.log('error: ' + error);
						callback(error,[]);
					}
					callback(null,data);
				}
			);
			break;
		case 'sound':
			step(
				function init() {
					//Get audio for the given query
					sound.fetchSound(query, true, this);
				},
				function getWeather(error,data) {
					if(error) {
						console.log('error: ' + error);
						callback(error,[]);
					}
					if(data.length < 1) {
						sound.fetchSound(query, false, this);
					} else {
						weather.fetchWeather(data,this);
					}
				},
				function getResult(error,data) {
					//Be sure to have data before going on
					if(!error && data.length < 1) {
						error = 'No data could be retrieved.';
					}
					if(error) {
						console.log('error: ' + error);
						callback(error,[]);
					}
					
					var result = [];
					
					if(data[0][0]) {
						for(var w=0; w < data.length; w++) {
							result.push(data[w][0]);
						}
					} else {
						result = data;
					}
					callback(null,result);
				}
			);
			break;
	}
};

Fetch.prototype.get = function(index, queries, callback) {
	
	var userQuery = {
			'Text':queries.Text ? queries.Text : null, 
			'Image':queries.Image ? queries.Image : null,
			'Video':queries.Video ? queries.Video : null,
			'Sound':queries.Sound ? queries.Sound : null
	};
	
	var queryAdjustment = {};
	queryAdjustment['Fish'] = ' underwater';
	
	//content object data storage
	var contentObject = {
			  "ID": index,
			  "Name": "",
			  "Screenshot": "",
			  "Category": "",
			  "CategoryPath": "", 
			  "Files": []
	};
	
	//Step through the content object data collection
	step(
		function getModelData() {	
			console.log('1. Start fetching Content Object data for 3D model with index '+index);
			
			modeldb.fetchModel(index, this);
		},
		function getTextData(error,data) {
			//Be sure to have data before going on
			if(!error && data.length < 1) {
				error = 'No model data could be retrieved.';
			}
			if(error) {
				console.log('modeldb error: ' + error);
				return [];
			}
			
			console.log('2. Model data fetched!');

			contentObject.Name = data[0].Name;
			contentObject.Screenshot = data[0].Preview;
			contentObject.CategoryPath = data[0].CategoryPath;
			contentObject.Category = data[0].Category;
			
			//We wont need the category path in the individual files
			delete data[0].Category;
			delete data[0].CategoryPath;
			
			//Push the 3D model to the files array of the content object
			contentObject.Files.push(data[0]);
			
			var dbpediaQuery = contentObject.Name;
			
			if(userQuery.Text) {
				dbpediaQuery = userQuery.Text;
			}
			
			//Fetch free text data for the model
			dbpedia.fetchText(dbpediaQuery, contentObject.Category, this);
		},
		function getImageData(error,data) {
			//Be sure to have data before going on
			if(!error && data.length < 1) {
				error = 'No text data could be retrieved.';
			}
			if(error) {
				console.log('dbpedia error: '+error);
				return [];
			}
			
			console.log('3. Text data fetched!');
			//Push the text data in the Files array because it will be treated as MediaItem in RUCoD
			contentObject.Files.push(data[0]);
			
			var flickrQuery = contentObject.Name;
			
			if(userQuery.Image) {
				flickrQuery = userQuery.Image;
			} else if (queryAdjustment[contentObject.Category]) {
				flickrQuery += queryAdjustment[contentObject.Category];
			} else {
				flickrQuery += ' '+contentObject.Category;
			}
			
			flickr.fetchImage(flickrQuery,1,this);
		},
		function getImageWeatherData(error,data) {
			//Be sure to have data before going on
			if(!error && data.length < 1) {
				error = 'No image data could be retrieved.';
			}
			if(error) {
				console.log('flickr error: '+error);
				return [];
			}
			console.log('4. Flickr images fetched!');
			//Get weather data for images
			weather.fetchWeather(data,this);
		},
		function getVideoData(error,data) {
			//Be sure to have data before going on
			if(!error && data.length < 1) {
				error = 'No weather data could be retrieved.';
			}
			if(error) {
				console.log('weather error: '+error);
				return [];
			}
			console.log('4.1. Weather data for flickr images fetched!');
			
			for(var w=0; w < data.length; w++) {
				contentObject.Files.push(data[w][0]);
			}
			//Some query adjustments for youtube
			var youtubeQuery = contentObject.Name;
			
			if(userQuery.Video) {
				youtubeQuery = userQuery.Video;
			} else if(queryAdjustment[contentObject.Category]) {
				youtubeQuery += queryAdjustment[contentObject.Category];
			} else {
				youtubeQuery += ' '+contentObject.Category;
			}
			
			//Get videos for content object
			youtube.fetchVideo(youtubeQuery,this);
		},
		function getSoundData(error,data) {
			//Be sure to have data before going on
			if(!error && data.length < 1) {
				error = 'No video data could be retrieved.';
			}
			if(error) {
				console.log('youtube error: '+error);
				return [];
			}
			console.log('5. YouTube data fetched!');
			
			for(var y=0; y < data.length; y++) {
				contentObject.Files.push(data[y]);
			}
			
			var soundQuery = contentObject.Name;
			
			if(userQuery.Sound) {
				soundQuery = userQuery.Sound;
			} 
			
			//Get audio for content object
			sound.fetchSound(soundQuery, true, this);
		},
		function evaluateSoundData(error,data) {
			if(error) {
				console.log('sound error: '+error);
				return [];
			}
			
			if(data.length < 1) {
				
				var soundQuery = contentObject.Name;
				
				if(userQuery.Sound) {
					soundQuery = userQuery.Sound;
				} 
				
				//Get audio for content object
				sound.fetchSound(soundQuery, false, this);
			} else {
				console.log('5.1 Sound data with geo information fetched!');
				//Get weather data for sounds
				weather.fetchWeather(data,this);
			}
		},
		function finalizeData(error,data) {
			//Be sure to have data before going on
			if(!error && data.length < 1) {
				error = 'No composed sound data could be retrieved.';
			}
			if(error) {
				console.log('sound error: '+error);
			} else { 
			
				console.log('6. Composed Sound data fetched!');
				for(var s=0; s < data.length; s++) {
					contentObject.Files.push(data[s][0]);
				}
			}
			
			delete contentObject.Category;
			
			console.log('Finished!');
			
			//Return the collected content object
			callback(null, contentObject);
		}
	);
};    

//Hook into commonJS module systems
if (typeof module !== 'undefined' && "exports" in module) {
  module.exports.Fetch = Fetch;
}   