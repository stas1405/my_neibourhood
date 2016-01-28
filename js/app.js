'use strict';

  var map;
  var infowindow;

var MarkerModel = function(marker, name, contact, position) {
  this.marker = marker;
  this.name = name;
  this.contact = contact;
  this.position = position;
};

function MapViewModel() {
  var self = this;
  var venueMarkers = [];
  self.listBoolean = ko.observable(true);
  self.searchword = ko.observable(''); //variable for user input
  self.locationsList = ko.observableArray([]); //list of locations from Foursquare API
  self.searchedList = ko.observableArray(self.locationsList()); //List of locations for search 
  var foursquareBaseUrl = "https://api.foursquare.com/v2/venues/explore?ll=49.246292,-123.116226&&limit=20&section=topPicks&day=any&time=any&locale=en&oauth_token=GZVQCNRCS5141KWELGOWRD35HCOD1NM03PDRUXE4PHZEFH51&v=20160106";

  self.listToggle = function () {
    if (self.listBoolean() === true) {
      self.listBoolean(false);
    } else {
      self.listBoolean(true);
    }
  };

  self.markerClick = function () {
      self.listBoolean(false); 
  };
  self.closeclick = function(){
      self.listBoolean(true); 
  };

    // Getting list of location from Foursquare
  $.getJSON(foursquareBaseUrl, function(data) {
    self.locationsList(data.response.groups[0].items);

    //Function to sort list of location.
    self.sortLocations = function () {
      self.locationsList.sort(function(left, right) { 
          return left.venue.name == right.venue.name ? 0 : (left.venue.name < right.venue.name ? -1 : 1);
      });
    };
    self.sortLocations();
    self.searchedList(self.locationsList());

    //Creating markers to pop up the map
    self.locLen = self.locationsList().length;
    for (var l = 0; l < self.locLen;  l++) {
      createMarkers(self.locationsList()[l]);
    }
  }).fail(function(jqXHR, status, error) {
    console.log(status);
    if (status == 'error') {
      alert("Forsquare API is not reachable. Try to refresh this page later");
    }
  });

  //Update list of location with button click, based on search criteria
  self.displayList = ko.computed(function() {
    var venue;
    var list = [];
    var searchword = self.searchword().toLowerCase();

    if (searchword !== "") {
      for (var i = 0; i < self.locLen; i++) {
        venue = self.locationsList()[i].venue;
        if (venue.name.toLowerCase().indexOf(searchword) != -1) {
          list.push(self.locationsList()[i]);
        }
      }
      self.searchedList(list);
    } else if (searchword === "") {
      self.searchedList(self.locationsList());
      filteringMarkersBy(searchword);
    }
  });

  self.updateList = function(data) {
    var venueName = data.venue.name.toLowerCase();
    var venueMarkersLen  = venueMarkers.length;
    for (var i = 0; i < venueMarkersLen; i++) {
      if (venueMarkers[i].name === venueName) {
        google.maps.event.trigger(venueMarkers[i].marker, 'click');

        map.panTo(venueMarkers[i].position);
      }
    }
  };

  // update map markers based on search keyword
  self.displayMarkers = ko.computed(function() {
    filteringMarkersBy(self.searchword().toLowerCase());
  });

  // filtering method for map markers
  function filteringMarkersBy(keyword) {
    var venueMarkersLen = venueMarkers.length;
    for (var i = 0; i < venueMarkersLen; i++) {
      if (venueMarkers[i].marker.map === null) {
        venueMarkers[i].marker.setMap(map);
      }
      if (venueMarkers[i].name.indexOf(keyword) === -1) {
        venueMarkers[i].marker.setMap(null);
      }
    }
  }

  //Generates markesr data from locations list
  function createMarkers(placeData) {
    var lat = placeData.venue.location.lat;
    var lng = placeData.venue.location.lng;
    var name = placeData.venue.name;
    var category = placeData.venue.categories[0].name;
    var position = new google.maps.LatLng(lat, lng);
    var address = placeData.venue.location.formattedAddress;
    var contact = placeData.venue.contact.formattedPhone;
    var describtion = placeData.tips[0].text;
    window.mapBounds = new google.maps.LatLngBounds();
    var bounds = window.mapBounds; // current boundaries of the map window

    bounds.extend(new google.maps.LatLng(lat, lng));
    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());
    var icon = {
      url: "img/pin1.png", // url
      scaledSize: new google.maps.Size(30, 30), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(0, 0) // anchor
    };

    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: name,
      animation: google.maps.Animation.DROP,
      icon: icon
    });
    marker.addListener('click', toggleBounce);

    google.maps.event.addListener(marker, 'click', function() {
      self.markerClick(); 
      infowindow.setContent(contentWindow);
      infowindow.open(map, this);
      map.panTo(position);
    });

    function toggleBounce() {
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          marker.setAnimation(null);
        }, 1400);
      }
    }

    venueMarkers.push(new MarkerModel(marker, name.toLowerCase(), contact, position));
    // DOM element for infowindow content
    var contentWindow = '<div class="markerInfo"><p id="locationName">' + name +
      '</p><p id="locationAddress">' + contact +
      '</p><p id="locationDescription">' + address;
  }
}


function initializeMap() {
  var mapOptions = {
    maxZoom: 13,
    scrollwheel: true,
    disableDefaultUI: false
  };

  map = new google.maps.Map(document.querySelector('#map'), mapOptions);
  infowindow = new google.maps.InfoWindow();

      google.maps.event.addListener(infowindow, 'closeclick', function() {
        myModel.viewModel.listToggle();
    });
}

function handleError() {
  alert("There is a problem loading Google Maps API. Check your reference.");
}

window.addEventListener('load', initializeMap);

window.addEventListener('resize', function(e) {

  map.fitBounds(mapBounds);
});



var myModel = { viewModel: new MapViewModel() };
ko.applyBindings(myModel.viewModel);