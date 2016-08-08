'use strict';
var mi_charts_widget = require('./mi-chart-widget');
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
var widget = function(elid,onModelReady){
      return new mi_charts_widget(elid,{
                namespace: "spiddal_ctd",
                title: "CTD Readings (-20m)",
                model: model(),
                stockcharts: [
                    {field: "temperature", title: "Subsea Temp", units: "&deg;C"},
                    {field: "pressure", title:"Pressure", units: "dbar"},
                    {field: "conductivity", title:"Conductivity", units: "mS/cm" },
                    {field: "soundVelocity", title: "Sound Velocity", units: "m/s"}
                ],
                onModelReady: onModelReady,
                preload: {
                    url: 'http://spiddal.marine.ie/data/spiddal-ctd-sample.json',
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
