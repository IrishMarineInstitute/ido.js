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
               date: data[0].trim(),
               time: data[1].trim(),
               wavelength_fluorescence: parseFloat(data[2].trim()),
               chlorophyll_counts: parseFloat(data[3].trim()),
               wavelength_turbidity: parseFloat(data[4].trim()),
               turbidity_counts: parseFloat(data[5].trim()),
               thermistor: parseFloat(data[6].trim()),
               chlorophyll: 0.0181 * (parseFloat(data[3].trim()) - 49.0),
               turbidity: 0.0483 * (parseFloat(data[5].trim()) - 50.0)
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      chlorophyll: function(parsed){
          return {timestamp: parsed.timestamp, chlorophyll: parsed.chlorophyll};
      },
      turbidity: function(parsed){
          return {timestamp: parsed.timestamp, turbidity: parsed.turbidity};
      }
  };
}

var widget = function(elid,onModelReady){
    return new mi_charts_widget(elid,{
                namespace: "spiddal-fluorometer",
                title: "Fluorometer (-20m)",
                model: model(),
                stockcharts: [
                    {field: "chlorophyll", title: "Chlorophyll", units: "ug/l"},
                    {field: "turbidity", title:"Turbidity", units: "NTU"}
                ],
                onModelReady: onModelReady,
                preload: {
                    url: 'http://spiddal.marine.ie/data/spiddal-fluorometer-sample.json',
                    source: "data",
                    target: "raw"
                },
                mqtt: {
                   topic: "spiddal-fluorometer",
                   target: "raw"
                }
     });
};
exports.model = model;
exports.widget = widget;
