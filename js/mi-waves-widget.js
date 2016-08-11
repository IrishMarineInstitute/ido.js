'use strict';
var mi_charts_widget = require('./mi-chart-widget');
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

var gauge = function(station,elid,onModelReady){
  var d = new Date();
  d.setDate(d.getDate() - 2);
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 3);
  var end_date = d.toISOString();
    var url = 'http://erddap.marine.ie/erddap/tabledap/IWaveBNetwork30Min.json?time,SeaTemperature,SignificantWaveHeight&time>='+start_date+'&time<='+end_date+'&station_id="'+station+'"&SeaTemperature!=0.0000&PeakPeriod>=0';
    return new mi_charts_widget(elid,{
                namespace: "wave_buoy_"+station.replace(/\s+/g, '-').toLowerCase(),
                title: "Wave Buoy",
                model: model(station),
                stockcharts: [
                    {field: "temperature", title: "Surface Sea Temp", units: "&deg;C"},
                    {field: "significantWaveHeight", title: "Sig. Wave Height", units: "m"},
                ],
                onModelReady: onModelReady,
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
exports.gauge = gauge;
