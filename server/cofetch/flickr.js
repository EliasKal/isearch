/**
 * Image fetch for Content Object production.
 * Facilitates Flickr API with node.io
 */
var nodeio = require('node.io');

var imageMethods = {
	input: false,
	run: function() {

		//Let's get the arguments passed to the script
		if (!this.options.args[0]) {
			this.exit('No arguments were given to the Flickr job');
		}
		//console.log(this.options.args);
		
		var query = this.options.args[0].replace(/\s/g,'+');
		var geo = this.options.args[1];
		var results = new Array();

		var apiKey = '5226908fe75b3dae6290f60162a501d5';
		var maxResults = 10;
		
		var licenses = [
	                   { "name": "All Rights Reserved", "url": "" },
	                   { "name": "Attribution-NonCommercial-ShareAlike License", "url": "http://creativecommons.org/licenses/by-nc-sa/2.0/"},
	                   { "name": "Attribution-NonCommercial License", "url": "http://creativecommons.org/licenses/by-nc/2.0/"},
	                   { "name": "Attribution-NonCommercial-NoDerivs License", "url": "http://creativecommons.org/licenses/by-nc-nd/2.0/" },
	                   { "name": "Attribution License", "url": "http://creativecommons.org/licenses/by/2.0/" },
	                   { "name": "Attribution-ShareAlike License", "url": "http://creativecommons.org/licenses/by-sa/2.0/" },
	                   { "name": "Attribution-NoDerivs License", "url": "http://creativecommons.org/licenses/by-nd/2.0/" },
	                   { "name": "No known copyright restrictions", "url": "http://www.flickr.com/commons/usage/" },
	                   { "name": "United States Government Work", "url": "http://www.usa.gov/copyright.shtml" }
	               ];

		var searchURL = "http://api.flickr.com/services/rest/?"
			+ 'method=flickr.photos.search'
			+ '&api_key=' + apiKey
			+ '&text=' + query;
		if(geo == 1) {
			searchURL += '&has_geo=1';
		}
		searchURL += '&per_page=' + maxResults
			+ '&format=json'
			+ '&nojsoncallback=1'
			+ '&sort=relevance';
		
		//console.log(searchURL);
		
		//Store the current context
	    var context = this;
		
		//Get results of photo search
		this.get(searchURL, function(error, data, headers) {

			//Exit if there was a problem with the request
			if (error) {
				context.exit(error); 
			}
			
			var photos = new Array();
			
			try {
				//Get the photo search result
				photos = JSON.parse(data).photos.photo;
			} catch(e) {
				context.emit(results);
			}
			
			//No sounds found, get back
	        if(photos.length < 1) {
	        	context.emit(results);
	        	return;
	        }
			
			//Adjust the maxResults parameter if there weren't enough results
			if(photos.length < maxResults) {
	        	maxResults = photos.length;
	        }
			
			//Iterate through every found photo
			for (var i=0;i<maxResults;i++) {
				
				try {
					//Store the image IDs
					var photoId = photos[i].id;
					
					//Get the image info for the current image
					var infoURL = "http://api.flickr.com/services/rest/?"
						+ 'method=flickr.photos.getInfo'
						+ '&api_key=' + apiKey
						+ '&photo_id=' + photoId
						+ '&format=json'
						+ '&nojsoncallback=1';
					
					context.get(infoURL, function(infoerror, data, headers) {
						
						//Exit if there was a problem with the request
						if (infoerror) {
							throw infoerror; 
						}
							
						var infoData = JSON.parse(data).photo;
						
						var tags = new Array;
						
						for(var t=0; t < infoData.tags.tag.length; t++) {
							tags.push(infoData.tags.tag[t]._content);
							//make sure to get not too many tags
				            if(i > 6) {
				            	break;
				            }
						}
						
						var result = {
							"Type": "ImageType",
							"Name": infoData.title._content,
							"Description": infoData.title._content,
							"Tags": tags,
							"Extension": infoData.originalformat || 'jpg',
							"License": licenses[infoData.license].name, 
							"LicenseURL": licenses[infoData.license].url,
							"Author": infoData.owner.realname || infoData.owner.username,
							"Date": infoData.dates.taken,
							"Size": "",
							"URL": "",
							"Preview": "",
							"Emotions": [],
							"Location": [0,0,0,0],
							"Weather": {}
						};
						
						if(infoData.location) {
							result.Location = [infoData.location.latitude || 0 ,infoData.location.longitude || 0,0,0];
						}
						
						//Get the image sizes for the current image
						var sizesURL = "http://api.flickr.com/services/rest/?"
							+ 'method=flickr.photos.getSizes'
							+ '&api_key=' + apiKey
							+ '&photo_id=' + infoData.id
							+ '&format=json'
							+ '&nojsoncallback=1';
						
						
						context.get(sizesURL, function(sizeserror, data, headers) {
							
							//Exit if there was a problem with the request
							if (sizeserror) {
								throw(sizeserror); 
							}
							
							var sizes = new Array;
							
							var sizeData = JSON.parse(data).sizes.size;
							var sizecount = sizeData.length;
							
							//Get the biggest available image index
							var sizeindex = sizecount-1;
							if(sizeData[sizeindex].label == 'Original') {
								sizeindex -= 1;
							}
							
							result.Preview = sizeData[0].source;
							result.URL     = sizeData[sizeindex].source;
							//Image size calculating: width x height x (24Bit = 3 Byte) / ( 5 = 1/5 of the bitmap size = the estimated jpg size)   
							result.Size    = (sizeData[sizeindex].width * sizeData[sizeindex].height * 3) / 5;
							
						
							results.push(result);
							
							if (results.length === maxResults) {
								//Exit the job if we're done, i.e Array full
								context.emit(results);
				            }
						}); // end images sizes callback
					}); // end image info callback
					
				} catch (e) {
					console.log("Flickr Error: " + e.message);
					maxResults--;
					
					if (results.length === maxResults) {
						//Exit the job if we're done, i.e Array full
						context.emit(results);
		            }
				}
			} // end for 
		}); // end image search callback
	}
};

var fetchImage = function(query, geo, callback) {
	//Creates the job
	var imageJob = new nodeio.Job({timeout:240}, imageMethods);
	nodeio.start(imageJob, {args: [query,geo]}, callback, true);
};

//Exposes it publicly
if (typeof module !== 'undefined' && "exports" in module) {
	  module.exports.fetchImage = fetchImage; 
}   
