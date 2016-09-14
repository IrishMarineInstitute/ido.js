'use strict';
var chart_widget = require('../speed-direction-chart-widget');
var model = function(){
    return {
      row: null,
      parsed: function(row){
        row.timestamp = Date.parse(row.hour);
        return row;
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      waterTemperature: function(parsed){
        return {timestamp: parsed.timestamp, waterTemperature: parsed.WaterTemperature};
      },
      waveHeight: function(parsed){
        return {timestamp: parsed.timestamp, waveHeight: parsed.WaveHeight};
      },
      wavePeriod: function(parsed){
        return {timestamp: parsed.timestamp, wavePeriod: parsed.WavePeriod};
      },
      windSpeed: function(parsed){
        return {timestamp: parsed.timestamp, windSpeed: parsed.AverageWindSpeed};
      },
      windDirection: function(parsed){
        return {timestamp: parsed.timestamp, windDirection: parsed.WindDirection};
      },
      windGustSpeed: function(parsed){
        return {timestamp: parsed.timestamp, windGustSpeed: parsed.GustSpeed};
      },
      windGustDirection: function(parsed){
        return {timestamp: parsed.timestamp, windGustDirection: parsed.WindGustDirection};
      },
  };
}
var available_components = ["location","title","latest","waterTemperature","waveHeight","wavePeriod","windSpeed","windDirection","windGustSpeed","windGustDirection"];
var widget = function(location,elid,options){
  options = options || {};
  options.components = options.components || available_components;
  var stockcomponents = {
    "waterTemperature": {field: "waterTemperature", title: "Water Temperature", units: "&deg;C"},
    "waveHeight": {field: "waveHeight", title: "Wave Height", units: "m"},
    "wavePeriod": {field: "wavePeriod", title: "Wave Period", units: "s"},
    "windSpeed": {field: "windSpeed", title: "Wind Speed", units: "knots"},
    "windDirection": {field: "windDirection", title: "Wind Direction", units: "degrees", directional: true},
    "windGustSpeed": {field: "windGustSpeed", title: "Wind Gust Speed", units: "knots"},
    "windGustDirection": {field: "windGustDirection", title: "Wind Gust Direction", units: "degrees", directional: true},
  }
  var stockcharts = []
  var components = {};
  for(var i=0;i<options.components.length;i++){
    if(location.metocean[options.components[i]]){
      components[options.components[i]] = true;
      var wanted = stockcomponents[options.components[i]];
      if(wanted) stockcharts.push(wanted);
    }
  }
  var d = new Date();
  d.setDate(d.getDate() - 3);
  var start_date = d.toISOString();
  var url = "//cilpublic.cil.ie/MetOcean/MetOcean.ashx?accesstoken=B9EF21E2-C563-4C07-94E9-198AF132C447&MMSI="+location.mmsi+"&FromDate="+start_date;
  return new chart_widget(elid,{
                namespace: "cilmetocean"+location.key,
                title: components.title?location.type:false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: url,
                    source: "MetOceanData",
                    target: "row"
                }
     });
};
exports.model = model;
exports.widget = widget;
exports.components = available_components;
