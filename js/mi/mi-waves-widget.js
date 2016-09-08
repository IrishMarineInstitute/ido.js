'use strict';
var mi_charts_widget = require('../mi-chart-widget');
var model = function(station){
    return {
      row: null,
      mqtt: undefined,
      parsed: function(_,row,mqtt){
        if(mqtt){
          try{
            var obj = JSON.parse(mqtt);
            if(obj.station_id != station){
              return _;
            }
            return {
              timestamp: Date.parse(obj.time),
              temperature: obj.SeaTemperature,
              significantWaveHeight: obj.SignificantWaveHeight
            };

          }catch(e){
            console.log(e);
            return _;
          }
        }
         try{
          return {
               timestamp: Date.parse(row[0]),
               temperature: row[1],
               significantWaveHeight: row[2]
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      temperature: function(parsed){
        return {timestamp: parsed.timestamp, temperature: parsed.temperature};
      },
      significantWaveHeight: function(parsed){
        return {timestamp: parsed.timestamp, significantWaveHeight: parsed.significantWaveHeight/100.0};
      }
  };
}

var widget = function(location,station,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","temperature","height"];
  var stockcomponents = {
    "temperature": {field: "temperature", title: "Surface Sea Temp", units: "&deg;C"},
    "height": {field: "significantWaveHeight", title: "Sig. Wave Height", units: "m"},
  }
  var custom = [];
  var stockcharts = [];
  var components = {};
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
  }
  var d = new Date();
  d.setDate(d.getDate() - 2);
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 3);
  var end_date = d.toISOString();
    var url = '//erddap.marine.ie/erddap/tabledap/IWaveBNetwork30Min.json?time,SeaTemperature,SignificantWaveHeight&time>='+start_date+'&time<='+end_date+'&station_id="'+station+'"&SeaTemperature!=0.0000&PeakPeriod>=0';
    return new mi_charts_widget(elid,{
                namespace: "wave-buoy-"+station.replace(/[\s+_]/g, '-').toLowerCase(),
                title: components.title?"Wave Buoy":false,
                location: components.location?location:false,
                model: model(station),
                stockcharts: stockcharts,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: url,
                    source: "table.rows",
                    target: "row"
                },
                mqtt: {
                   topic: "irish-wave-buoys",
                   target: "mqtt"
                }
     });
};
exports.model = model;
exports.widget = widget;
