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
  draw: {
    polyline: false,
    polygon: {
      allowIntersection: false,
      drawError:{
        color: '#CF6870',
        message: 'Error in drawing'
      },
      shapeOptions:{
        color: '#43857C'
      }
    },
    circle: false,
    marker: false,
    rectangle: {
      shapeOptions:{
        color: '#43857C'
      }
    },
  }
});

// Handling the creation of Leaflet.Draw layers
// Note here, the use of drawnLayerID - this is undoubdtedly the way you should approach
//  remembering and removing layers
var drawnLayer;
map.addControl(drawControl);

var userPolygon;
map.on('draw:created', function (e) {
  var type = e.layerType;
  var layer = e.layer;
  //console.log('draw created:', e);
  drawnLayer = e.layer;
  var coords = e.layer._latlngs; // this is vertex coordinates
  // console.log(coords);
  userPolygon = makeSqlPolygon(coords);
  // console.log(typeof(userPolygon));
  map.addLayer(layer);
  if((searchSQL !== undefined)){
    if(searchSQL.includes("WHERE")){
      searchSQL += " AND ST_Intersects(the_geom, " + userPolygon + ")";
    }else{
      searchSQL = crashSQL + "WHERE ST_Intersects(the_geom, " + userPolygon + ")";
    }
  }else{
    searchSQL = crashSQL + "WHERE ST_Intersects(the_geom, " + userPolygon + ")";
  }
  sublayers[1].setSQL(searchSQL);
});

map.on('draw:drawstart', function (e) {
  console.log('start');
  if (drawnLayer) {
    map.removeLayer(drawnLayer);
  }
});

//turns an array of latLngs into an ST_POLYGONFROMTEXT
function makeSqlPolygon(coords) {
  var i = "ST_SETSRID(ST_PolygonFromText(\'POLYGON((";
  _.each(coords, function(coord){
    i+=coord.lng + " " + coord.lat + ",";
  });
  i+=coords[0].lng + " " + coords[0].lat; //append coordinates of the first point again
  i+="))\'),4326)";
  return i;
}


// The viz.json output by publishing on cartodb
var layerSource = 'https://yuchu.cartodb.com/api/v2/viz/224799f6-00b4-11e6-a86a-0ea31932ec1d/viz.json';

var sublayers = [];


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
