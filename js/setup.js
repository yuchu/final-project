// Leaflet map setup
var map = L.map('map', {
  center: [40.002837,-75.118028],
  zoom: 12
});

var Stamen_TonerLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
}).addTo(map);


// Leaflet draw setup
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);


// Initialise the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
  edit: {
    featureGroup: drawnItems
  },
  draw: {
    polyline: false,
    polygon: false,
    circle: false
  }
});

// Handling the creation of Leaflet.Draw layers
// Note here, the use of drawnLayerID - this is undoubdtedly the way you should approach
//  remembering and removing layers
var drawnLayerID;
map.addControl(drawControl);
map.on('draw:created', function (e) {
  var type = e.layerType;
  var layer = e.layer;
  //console.log('draw created:', e);

  if (type === 'marker') {
    // Change the 5 here to alter the number of closest records returned!
    nClosest(layer._latlng, 5);
  } else if (type === 'rectangle') {
    pointsWithin(layer._latlngs);
  }

  if (drawnLayerID) { map.removeLayer(map._layers[drawnLayerID]); }
  map.addLayer(layer);
  drawnLayerID = layer._leaflet_id;
});


// The viz.json output by publishing on cartodb
var layerSource = 'https://yuchu.cartodb.com/api/v2/viz/224799f6-00b4-11e6-a86a-0ea31932ec1d/viz.json';

var sublayers = [];

// Use of CartoDB.js

// $.getJSON("https://yuchu.cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQuery, function(data) {
//         coffeeShopLocations = L.geoJson(data,{
//             onEachFeature: function (feature, layer) {
//                 layer.bindPopup('' + feature.properties.name + '' + feature.properties.address + '');
//                 layer.cartodb_id=feature.properties.cartodb_id;
//             }
//         }).addTo(map);
//     });

cartodb.createLayer(map, layerSource)
  .addTo(map)
  .on('done', function(layer) {
    for (var i = 0; i < layer.getSubLayerCount(); i++) {
      sublayers[i] = layer.getSubLayer(i);
    }
    sublayers[0].on('featureClick', function(e, latlng, pos, data, layer) {
      // console.log("mouse left polygon with data: " + layer);
      var id = data.cartodb_id;
      // console.log(data);
      // SELECT COUNT(crn),  FROM crash, censustract WHERE ST_intersects(crash.the_geom_webmercator, censustract.the_geom_webmercator);
      // console.log();
      cartodb.SQL({ user: 'yuchu' }).getBounds('select * from censustract WHERE cartodb_id = ' + id).done(function(bounds) {
        map.fitBounds(bounds);
        // console.log(bounds);
      });
    });

  })
  .on('error', function(err) {
    alert(err);
  });
