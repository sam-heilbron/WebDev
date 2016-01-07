/************************************************************************************************************************/
/**************************************** HANDLE MAP DIMENSIONS/CONTENT *************************************************/
/************************************************************************************************************************/

/* https://developers.google.com/maps/documentation/javascript/examples/ */

/*
Possible Additions:
	Include travel time in pop-up

*/

var MAP_DIM = { height: 500, width: 500 }; //default 500x500
var map, geocoder, geo_address, travel_time, travel_distance;      
var myDefaultPos= new google.maps.LatLng(42.3601, -71.0589); //default coordinates of boston
var Home_marker= new google.maps.Marker({ position: myDefaultPos});
var directionsService, directionsDisplay; //Google Directions

google.maps.event.addDomListener(window, 'load', setMyPosition);

/* Use Geolocation to set my postion */
function setMyPosition() {
	navigator.geolocation.getCurrentPosition(
		function(position) {
    		var pos = {
        		lat: position.coords.latitude,
        		lng: position.coords.longitude
      		};
      		var p = new google.maps.LatLng(pos.lat, pos.lng);
      		//myDefaultPos = p;
      		Home_marker.setPosition(p);
    	}, function() {
      		alert("Please visit another browser that uses geolocation");
    	});
    setTimeout(initialize , 10); //delay a bit to give geolocation time to find current position
}


/* Create map, set Home_marker on map */
function initialize() {
	geocoder = new google.maps.Geocoder();
	directionsService = new google.maps.DirectionsService;
  	directionsDisplay = new google.maps.DirectionsRenderer;
	var mapProperties = {mapTypeId:google.maps.MapTypeId.ROADMAP};
  	map = new google.maps.Map(document.getElementById("map_canvas"),mapProperties);
  	directionsDisplay.setMap(map);	
}

/* When modal opens, resize map and add content */
$(document).ready(function() {
	$('#gmaps_search').on('show.bs.modal', function(e) {
		var button = $(e.relatedTarget); // Button that triggered the modal
  		var recipient = button.data('destination'); // Extract info from data-* attributes
  		geo_address = recipient; //used to create marker of destination
		var footer = $(this).find('.modal-footer');
		$(this).find('.modal-title').text(recipient);
   		Trigger_resizeMap();
   		setTimeout(function() {footer.html("<b> Travel Time: " + travel_time + "</b>");} , 2000);
	});
});

/* Delay allows map to be generated before it is resized */
function Trigger_resizeMap() {
   if(typeof map =="undefined") return;
   setTimeout(resizingMap , 300);
}

/* Create new marker using geocoder on geo_address */
function resizingMap() {
   	if(typeof map =="undefined") return;
   	var marker = new google.maps.Marker({position: Home_marker.getPosition()}); //never link marker to map -> never visible (Good!)
   	google.maps.event.trigger(map, "resize");
	geocoder.geocode( { 'address': geo_address}, function(results, status) {
    	if (status == google.maps.GeocoderStatus.OK) {
    		marker.setPosition(results[0].geometry.location);
    		Zoom_to_Fit(marker);
      	} else {
        	directionsDisplay.set('directions', null);
        	map.setCenter(Home_marker.getPosition());
        	map.setZoom(15);
        	alert("Can't locate address. Sorry for the inconvenience");
      	}
    });   
}

/* Zoom the map to fit the marker that was added */
function Zoom_to_Fit(marker) {
	var markers = [Home_marker, marker];
	var bounds = new google.maps.LatLngBounds();
	for(i=0;i<markers.length;i++) {bounds.extend(markers[i].getPosition());}
	map.setCenter(bounds.getCenter())
	map.fitBounds(bounds);
	
	MAP_DIM.height = $('#map_canvas').height();
	MAP_DIM.width = $('#map_canvas').width();
	map.setZoom(getBoundsZoomLevel(bounds, MAP_DIM));
	calculateAndDisplayRoute(marker, directionsService, directionsDisplay);
}



/* Get Zoom level based off of bounds and map dimensions. fitBounds wasnt working as hoping so
this zooms properly */
/* Found this code online. All else, written by us */
function getBoundsZoomLevel(bounds, mapDim) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}


/* Calculate and Display route */
function calculateAndDisplayRoute(dest_marker, directionsService, directionsDisplay) {
	directionsService.route({
    	origin: Home_marker.getPosition(),
    	destination: dest_marker.getPosition(),
    	travelMode: google.maps.TravelMode.DRIVING,
    	drivingOptions: {
    		departureTime: new Date(Date.now()),
    		trafficModel: google.maps.TrafficModel.BEST_GUESS
  		}
  	}, function(response, status) {
    	if (status === google.maps.DirectionsStatus.OK) {
      		directionsDisplay.setDirections(response);
      		tavel_distance = response.routes[0].legs[0].distance.value / 1000;
      		travel_time = toHHMMSS(response.routes[0].legs[0].duration.value);
    	} else {
      		window.alert('Directions request failed due to ' + status);
    	}
  	});
}

/* Duraction in seconds -> duraction in hours, minutes, seconds */
function toHHMMSS(s) {
	var time = "";
    var hours   = Math.floor(s / 3600);
    var minutes = Math.floor((s - (hours * 3600)) / 60);
    var seconds = s - (hours * 3600) - (minutes * 60);
	if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    
    if(hours != "00") time += (hours + " hours, ");
    if(minutes != "00") time += (minutes + " minutes, ");
    time += (seconds + " seconds");
	return time;
}

function Meters_to_Miles(m) {

}