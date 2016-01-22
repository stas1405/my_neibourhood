var MarkerModel = function(marker, name, contact, position) {
  this.marker = marker;
  this.name = name;
  this.contact = contact;
  this.position = position;
};

function MapViewModel() {
  var self = this;
  var map; // declares a global map variable
  var infowindow;
  var venueMarkers = [];
  self.searchword = ko.observable(''); //variable for user input
  self.locationsList = ko.observableArray([]); //list of locations from Foursquare API
  self.searchedList = ko.observableArray(self.locationsList()); //List of locations for search 


  //Update list of location with button click, based on search criteria
  self.displayList = function() {
    var venue;
    var list = [];
    var searchword = self.searchword().toLowerCase();

    if (searchword !== "") {
      for (var i in self.locationsList()) {
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
  };

  self.updateList = function(data) {
    var venueName = data.venue.name.toLowerCase();
    for (var i in venueMarkers) {
      if (venueMarkers[i].name === venueName) {
        google.maps.event.trigger(venueMarkers[i].marker, 'click');
        map.panTo(venueMarkers[i].position);
      }
    }
    self.searchedList(data);
    filteringMarkersBy(venueName);
  };

  // update map markers based on search keyword
  self.displayMarkers = ko.computed(function() {
    filteringMarkersBy(self.searchword().toLowerCase());
  });

  // filtering method for map markers
  function filteringMarkersBy(keyword) {
    for (var i in venueMarkers) {
      if (venueMarkers[i].marker.map === null) {
        venueMarkers[i].marker.setMap(map);
      }
      if (venueMarkers[i].name.indexOf(keyword) === -1) {
        venueMarkers[i].marker.setMap(null);
      }
    }
  }

  /*
   initializeMap() is called when page is loaded.
  */
  function initializeMap() {

    var locations;
    var mapOptions = {
      zoom: 20,
      scrollwheel: true,
      disableDefaultUI: true
    };
    var googleMap = '<div id="map"></div>';

    $("#map").append(googleMap);

    map = new google.maps.Map(document.querySelector('#map'), mapOptions);

    infowindow = new google.maps.InfoWindow();

    //Request for locations list from foursquare API
    var foursquareBaseUrl = "https://api.foursquare.com/v2/venues/explore?ll=49.246292,-123.116226&&limit=20&section=topPicks&day=any&time=any&locale=en&oauth_token=GZVQCNRCS5141KWELGOWRD35HCOD1NM03PDRUXE4PHZEFH51&v=20160106";
    $.getJSON(foursquareBaseUrl, function(data) {
      self.locationsList(data.response.groups[0].items);
      self.searchedList(self.locationsList());
      for (var l in self.locationsList()) {
        createMarkers(self.locationsList()[l]);
      }
    }).fail(function(jqXHR, status, error){
      console.log(status)
    if(status == 'error'){
        alert("Forsquare API is not reachable. Try to refresр this page later")
    } else {
        //some other error
    }
});

    // Sets the boundaries of the map based on pin locations
    window.mapBounds = new google.maps.LatLngBounds();
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

    var bounds = window.mapBounds; // current boundaries of the map window

    bounds.extend(new google.maps.LatLng(lat, lng));
    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());

    // marker of a popular place
    var icon = {
      url: "img/pin.png", // url
      scaledSize: new google.maps.Size(20, 20), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(0, 0) // anchor
    };

    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: name,
      icon: icon
    });

    venueMarkers.push(new MarkerModel(marker, name.toLowerCase(), contact, position));
    bounds.extend(new google.maps.LatLng(lat, lng));
    map.fitBounds(bounds);
    map.setCenter(bounds.getCenter());
    // DOM element for infowindow content
    var contentWindow = '<div class="markerInfo"><p id="locationName">' + name +
      '</p><p id="locationAddress">' + contact +
      '</p><p id="locationDescription">' + address;


    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(contentWindow);
      infowindow.open(map, this);
      map.panTo(position);
    });
    google.maps.event.addListener(infowindow, 'closeclick', function() {
      self.displayList(); //close the infowindow and refresh the locations list

    });
  }

  window.addEventListener('load', initializeMap);

  window.addEventListener('resize', function(e) {

    map.fitBounds(mapBounds);
  });
}

$(function() {
  ko.applyBindings(new MapViewModel());
});