'use strict';
var mi_charts_widget = require('../mi-chart-widget');
var model = function(){
  return {
      raw: null,
      parsed: function(_,raw){
         try{
          var parts = raw.split("|");
          var data = parts[2].trim().split(/\s+/);
          return {
               timestamp: Date.parse(parts[0]),
               device: parts[1],
               pressure: parseFloat(data[0].trim()),
               temperature: parseFloat(data[1].trim()),
               conductivity: parseFloat(data[2].trim()),
               salinity: parseFloat(data[3].trim()),
               sound_velocity: parseFloat(data[4].trim()),
               raw_time: data[5].trim()
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      pressure: function(parsed){
          return {timestamp: parsed.timestamp, pressure: parsed.pressure};
      },
      temperature: function(parsed){
          return {timestamp: parsed.timestamp, temperature: parsed.temperature};
      },
      soundVelocity: function(parsed){
          return {timestamp: parsed.timestamp, soundVelocity: parsed.sound_velocity};
      },
      salinity: function(parsed){
          return {timestamp: parsed.timestamp, salinity: parsed.salinity};
      },
      conductivity: function(parsed){
          return {timestamp: parsed.timestamp, conductivity: parsed.conductivity};
      },
  };
}
var widget = function(location,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","temperature","pressure","conductivity","soundVelocity"];
  var stockcomponents = {
    "temperature": {field: "temperature", title: "Subsea Temp", units: "&deg;C"},
    "pressure": {field: "pressure", title:"Pressure", units: "dbar"},
    "conductivity": {field: "conductivity", title:"Conductivity", units: "mS/cm" },
    "soundVelocity": {field: "soundVelocity", title: "Sound Velocity", units: "m/s"}
  };
  var components = {};
  var stockcharts = [];
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
  }
  if(!components.latest){
    for(var i=0;i<stockcharts.length;i++){
      stockcharts[i].show_reading = false;
    }
  }
  return new mi_charts_widget(elid,{
                namespace: "spiddal-ctd",
                title: components.title?"CTD Readings (-20m)":false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                onModelReady: options.onModelReady,
                latest: components.latest?true:false,
                preload: {
                    url: '//spiddal.marine.ie/data/spiddal-ctd-sample.json',
                    source: "data",
                    target: "raw"
                },
                mqtt: {
                   topic: "spiddal-ctd",
                   target: "raw"
                }
     });
};

exports.model = model;
exports.widget = widget;
