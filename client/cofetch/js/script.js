/* Author: Arnaud */

$(document).ready(function(){
  
  /*===============================
    Load Data and populate the form
    ===============================*/
    
    var currentID = cofetchHandler.getParameterByName('id');
    if (currentID === "") {
      currentID = 1;
    };
    console.log(currentID);
    
    //Fetch the data and populate the form
    //cofetchHandler.fetch(currentID);
    cofetchHandler.fetchCategories();
    
    $( "#script-tabs" ).tabs({panelTemplate: '<section></section>'});
    
  /*===================================
    Registering all the events handlers
    ===================================*/
  $("#script-start").click(function(){
	if($("#script-keywords").val().length < 3 || $("#script-category").val() == "") {
		alert("Please specify at least one search keyword as well as the search category!");
	} else {
		cofetchHandler.fetch($("#script-keywords").val(),$("#script-category").val(),$("#script-automatic").val());
	}
	return false;
  });
  
  $("#search-text").click(function(){
    cofetchHandler.getText($("#search-text-phrase").val());
    return false;
  });  
  
  $("#change-threed").click(function(){
	cofetchHandler.set3d(true);
	return false;
  });
  
  $("#search-threed").click(function(){
	cofetchHandler.get3d($("#search-threed-phrase").val());
	return false;
  });  
    
  $("#change-image").click(function(){
    cofetchHandler.setImage(true);
    return false;
  });
  
  $("#search-image").click(function(){
    cofetchHandler.getImage($("#search-image-phrase").val());
    return false;
  });
  
  $("#change-video").click(function(){
    cofetchHandler.setVideo(true);
    return false;
  });
  
  $("#search-video").click(function(){
    cofetchHandler.getVideo($("#search-video-phrase").val());
    return false;
  });
  
  $("#change-sound").click(function(){
    cofetchHandler.setSound(true);
    return false;
  });
  
  $("#search-sound").click(function(){
    cofetchHandler.getSound($("#search-sound-phrase").val());
    return false;
  });
  
  $("#previous").click(function(){
    //Load the previous URL
    //i.e take the parameter, decrement it, and load the page
    var currentLocation = window.location;
    var newLocation = window.location.href.substring(0,window.location.href.indexOf("?"));
    newID = parseInt(currentID) - 1;
    newLocation += "?id=" + newID ;
    console.log(newLocation);
    window.location = newLocation;
    return false;
  });
  
  $("#next").click(function(){
    //load next
    var currentLocation = window.location;
    var newLocation = window.location.href.substring(0,window.location.href.indexOf("?"));
    newID = parseInt(currentID) + 1;
    newLocation += "?id=" + newID ;
    console.log(newLocation);
    window.location = newLocation;
    return false;
  });
  
  $("#save").click(function(e){
	
	e.preventDefault();  
	
	//post JSON to the correct handler server
    var sent = cofetchHandler.save();
    
    //load next 
    /*
    var currentLocation = window.location;
    var newLocation = window.location.href.substring(0,window.location.href.indexOf("?"));
    newID = parseInt(currentID) + 1;
    newLocation += "?id=" + newID ;
    console.log(newLocation);
    window.location = newLocation;
    */
    return false;
  });
  
});























