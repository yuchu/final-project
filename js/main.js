$("#sublayer0").on('click', function() {
  sublayers[0].toggle();
});

$("#sublayer1").on('click', function() {
  sublayers[1].toggle();
});



$("#download_section_button").on('click',function(){
  $("#search_section").hide();
  $("#search_section_button").removeClass("active");
  $("#download_section").show();
  $("#download_section_button").addClass("active");
  $('.leaflet-draw-toolbar').show();
  $("#choose_map").hide();
  $("#about_section").hide();
});

$("#search_section_button").on('click',function(){
  $("#search_section").show();
  $("#search_section_button").addClass("active");
  $("#download_section").hide();
  $("#download_section_button").removeClass("active");
  $('.leaflet-draw-toolbar').hide();
  $("#choose_map").show();
  $("#about_section").hide();
  $("#about_section_button").removeClass("active");
});

$("#about_section_button").on('click',function(){
  $("#search_section").hide();
  $("#search_section_button").removeClass("active");
  $("#download_section").hide();
  $("#download_section_button").removeClass("active");
  $('.leaflet-draw-toolbar').hide();
  $("#choose_map").hide();
  $("#about_section").show();
  $("#about_section_button").addClass("active");
});

var searchSQL;
var crashSQL = 'SELECT * FROM crash ';
var year2011SQL = 'crash_year = 2011';
var year2012SQL = 'crash_year = 2012';
var year2013SQL = 'crash_year = 2013';
var year2014SQL = 'crash_year = 2014';
var fatalSQL = 'fatal_count > 0';
var majinjSQL = 'maj_inj_count > 0';
var noinjSQL = 'injury_count = 0';
var bikeSQL = 'bicycle_count > 0';
var pedSQL = 'ped_count > 0';


var filterList = [year2011SQL,year2012SQL,year2013SQL,year2014SQL,fatalSQL,majinjSQL,noinjSQL,bikeSQL,pedSQL];
var apiKey = '&api_key=db7140c1a9553b097d7110c16259bd9d9c5c45f1';
var crashcount_tractSQL = 'UPDATE censustract SET crash_count = (SELECT count(*) FROM crash WHERE ST_Intersects(the_geom, censustract.the_geom)) ';
// var crashcount_streetSQL = 'UPDATE street SET crash_count = (SELECT count(*) FROM crash WHERE ST_Intersects(the_geom, street.the_geom)) ';
var crashdensity_tractSQL = 'UPDATE censustract SET crash_density = (crash_count / area) ';
// var crashdensity_streetSQL = 'UPDATE street SET crash_density = (crash_count / shape_len) ';

var reset = function(){
  $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + crashcount_tractSQL + apiKey).done();
  $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + crashdensity_tractSQL + apiKey).done();
};

reset();

var checkRadioInputs = function(){
  var radioInputs = $('input[type=radio]').map(function(_, element){
    return $(element).prop('checked');
  }).get();
  var select = [];
  for(i=0; i<12; i++){
    if(i!==0 & i!==5 & i!==9){select.push(radioInputs[i]);}
  }
  var zipRadioInputs = _.zip(select,filterList);
  var radioFilters = _.chain(zipRadioInputs)
    .filter(function(zip){ return zip[0];})
    .map(function(zip){ return zip[1];})
    .value();
  return radioFilters;
};

var getDownloadType = function(){
  var radioInputs = $('input[type=radio]').map(function(_, element){
    return $(element).prop('checked');
  }).get();
  var select=[];
  for(i=12; i<15; i++){
    select.push(radioInputs[i]);
  }
  return select;
};

var update_crashcount = function(radioResult){
  var update_crashcount_tractSQL = 'UPDATE censustract SET crash_count = (SELECT count(*) FROM crash WHERE ' + radioResult.join(' AND ') + ' AND ' + 'ST_Intersects(the_geom, censustract.the_geom)) ';
  $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + update_crashcount_tractSQL + apiKey).done();
};

var update_crashdensity = function(){
  $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + crashdensity_tractSQL + apiKey).done();
};


$('#search').click(function(){
  $("#map_none").prop("checked", true);
  var cartocss = [
    '#censustract{',
      'polygon-fill: #adadad;',
      'polygon-opacity: 0.5;',
      'line-color: #fff;',
      'line-width: 0.8;',
      'line-opacity: 1;',
    '}',
  ].join("\n");
  sublayers[0].setCartoCSS(cartocss);
  var radioResult = checkRadioInputs();
  if(radioResult.length>0){
    searchSQL = crashSQL + 'WHERE ' + radioResult.join(' AND ');
    sublayers[1].setSQL(searchSQL);
    console.log(radioResult.join(' AND '));
    update_crashcount(radioResult);
    update_crashdensity();
  }else{
    searchSQL = crashSQL;
    sublayers[1].setSQL(searchSQL);
    reset();
  }
});

$('#download').click(function(){
  var getType = getDownloadType();
  var type;
  var url;
  if(getType.indexOf(true)===0){
    type = 'shp';
  }else if(getType.indexOf(true)===1){
    type = 'geojson';
  }else{
    type = 'csv';
  }

  if(searchSQL === undefined){
    url = 'https://yuchu.cartodb.com/api/v2/sql?format=' + type + '&filename=download&q=' + crashSQL;
  }else{
    url = 'https://yuchu.cartodb.com/api/v2/sql?format=' + type + '&filename=download&q=' + searchSQL;
  }
  window.open(url,'download');
});

$('#map_none').click(function(){
  var cartocss = [
    '#censustract{',
      'polygon-fill: #adadad;',
      'polygon-opacity: 0.5;',
      'line-color: #fff;',
      'line-width: 0.8;',
      'line-opacity: 1;',
    '}',
  ].join("\n");
  sublayers[0].setCartoCSS(cartocss);
});

$('#map_crash_count').click(function(){
  var sql = new cartodb.SQL({ user: 'yuchu'});
  sql.execute('SELECT (CDB_QuantileBins(array_agg(crash_count)::numeric[], 5)) FROM censustract')
    .done(function(data){
      var count_datarows = data.rows;
      var count_quantile = count_datarows[0].cdb_quantilebins;
      console.log(count_quantile);
      var count_cartocss = [
        '#censustract{',
          'polygon-fill: #FFFFB2;',
          'polygon-opacity: 0.8;',
          'line-color: #fff;',
          'line-width: 0.8;',
          'line-opacity: 1;',
        '}',
        '#censustract [ crash_count <=' + count_quantile[4] + '] {',
           'polygon-fill: #BD0026;',
        '}',
        '#censustract [ crash_count <=' + count_quantile[3] + '] {',
           'polygon-fill: #F03B20;',
        '}',
        '#censustract [ crash_count <=' + count_quantile[2] +  '] {',
           'polygon-fill: #FD8D3C;',
        '}',
        '#censustract [ crash_count <=' + count_quantile[1] +  '] {',
           'polygon-fill: #FECC5C;',
        '}',
        '#censustract [ crash_count <=' + count_quantile[0] +  '] {',
           'polygon-fill: #FFFFB2;',
        '}'
      ].join("\n");
      sublayers[0].setCartoCSS(count_cartocss);
    });
});

$('#map_crash_density').click(function(){
  update_crashdensity();
  var sql = new cartodb.SQL({ user: 'yuchu'});
  sql.execute('SELECT (CDB_QuantileBins(array_agg(crash_density)::numeric[], 5)) FROM censustract')
    .done(function(data){
      var density_datarows = data.rows;
      var density_quantile = density_datarows[0].cdb_quantilebins;
      console.log(density_quantile);
      var density_cartocss = [
        '#censustract{',
          'polygon-fill: #FFFFB2;',
          'polygon-opacity: 0.8;',
          'line-color: #fff;',
          'line-width: 0.8;',
          'line-opacity: 1;',
        '}',
        '#censustract [ crash_density <=' + density_quantile[4] + '] {',
           'polygon-fill: #BD0026;',
        '}',
        '#censustract [ crash_density <=' + density_quantile[3] + '] {',
           'polygon-fill: #F03B20;',
        '}',
        '#censustract [ crash_density <=' + density_quantile[2] +  '] {',
           'polygon-fill: #FD8D3C;',
        '}',
        '#censustract [ crash_density <=' + density_quantile[1] +  '] {',
           'polygon-fill: #FECC5C;',
        '}',
        '#censustract [ crash_density <=' + density_quantile[0] +  '] {',
           'polygon-fill: #FFFFB2;',
        '}'
      ].join("\n");
      sublayers[0].setCartoCSS(density_cartocss);
    });
});

// Get column values
var usersql = new cartodb.SQL({ user: 'yuchu'});
usersql.execute('SELECT crash_count,namelsad10 FROM censustract ORDER BY namelsad10 ASC').done(function(data) {
    getcrash = data.rows;
    // console.log(getcrash);
});
usersql.execute('SELECT namelsad10 FROM censustract ORDER BY namelsad10 ASC').done(function(data) {
    getcensus = data.rows;
    // console.log(getcensus);
});
