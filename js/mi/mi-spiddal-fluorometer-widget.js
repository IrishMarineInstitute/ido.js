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

var widget = function(location,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","chlorophyll","turbidity"];
  var stockcomponents = {
    "chlorophyll": {field: "chlorophyll", title: "Chlorophyll", units: "ug/l"},
    "turbidity": {field: "turbidity", title:"Turbidity", units: "NTU"}
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
                namespace: "spiddal-fluorometer",
                title: components.title?"Fluorometer (-20m)":false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: '//spiddal.marine.ie/data/spiddal-fluorometer-sample.json',
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
