$("#sublayer0").on('click', function() {
  sublayers[0].toggle();
});

$("#sublayer1").on('click', function() {
  sublayers[1].toggle();
});

$("#sublayer2").on('click', function() {
  sublayers[2].toggle();
});

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
var crashcount_streetSQL = 'UPDATE street SET crash_count = (SELECT count(*) FROM crash WHERE ST_Intersects(the_geom, street.the_geom)) ';
// var crashdensity_tractSQL = 'UPDATE censustract SET crash_density = (crash_count / area) ';
// var crashdensity_streetSQL = 'UPDATE street SET crash_density = (crash_count / shape_len) ';

$.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + crashcount_tractSQL + apiKey).done();

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


$('#search').click(function(){
  var cartocss = [
    '#censustract{',
      'polygon-fill: #5CA2D1;',
      'polygon-opacity: 0.5;',
      'line-color: #FFF;',
      'line-width: 0.5;',
      'line-opacity: 1;',
    '}',
  ].join("\n");
  sublayers[0].setCartoCSS(cartocss);
  var radioResult = checkRadioInputs();
  if(radioResult.length>0){
    sublayers[2].setSQL(crashSQL + 'WHERE ' + radioResult.join(' AND '));
    console.log(radioResult.join(' AND '));
    update_crashcount_tractSQL = 'UPDATE censustract SET crash_count = (SELECT count(*) FROM crash WHERE ' + radioResult.join(' AND ') + ' AND ' + 'ST_Intersects(the_geom, censustract.the_geom)) ';
    $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + update_crashcount_tractSQL + apiKey).done();
    // $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + crashdensity_tractSQL + apiKey).done();
  }else{
    sublayers[2].setSQL(crashSQL);
    $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + crashcount_tractSQL + apiKey).done();
    // $.ajax('https://yuchu.cartodb.com/api/v2/sql?q=' + crashdensity_tractSQL + apiKey).done();
  }

});

$('#map_none').click(function(){
  var cartocss = [
    '#censustract{',
      'polygon-fill: #5CA2D1;',
      'polygon-opacity: 0.5;',
      'line-color: #FFF;',
      'line-width: 0.5;',
      'line-opacity: 1;',
    '}',
  ].join("\n");
  sublayers[0].setCartoCSS(cartocss);
});

$('#map_crash_count').click(function(){
  var sql = new cartodb.SQL({ user: 'yuchu'});
  sql.execute('SELECT (CDB_QuantileBins(array_agg(crash_count)::numeric[], 5)) FROM censustract')
    .done(function(data){
      var datarows = data.rows;
      quantile = datarows[0].cdb_quantilebins;
      console.log(quantile);
      var cartocss = [
        '#censustract{',
          'polygon-fill: #FFFFB2;',
          'polygon-opacity: 0.8;',
          'line-color: #FFF;',
          'line-width: 0.5;',
          'line-opacity: 1;',
        '}',
        '#censustract [ crash_count <=' + quantile[4] + '] {',
           'polygon-fill: #BD0026;',
        '}',
        '#censustract [ crash_count <=' + quantile[3] + '] {',
           'polygon-fill: #F03B20;',
        '}',
        '#censustract [ crash_count <=' + quantile[2] +  '] {',
           'polygon-fill: #FD8D3C;',
        '}',
        '#censustract [ crash_count <=' + quantile[1] +  '] {',
           'polygon-fill: #FECC5C;',
        '}',
        '#censustract [ crash_count <=' + quantile[0] +  '] {',
           'polygon-fill: #FFFFB2;',
        '}'
      ].join("\n");
      sublayers[0].setCartoCSS(cartocss);
    });
});
