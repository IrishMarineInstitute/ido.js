'use strict';
var mi_charts_widget = require('./mi-chart-widget');
var model = function(){
    return {
      row: null,
      parsed: function(_,row){
         try{
          return {
               timestamp: Date.parse(row[0]),
               waterLevel: row[1]
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      waterLevel: function(parsed){
        return parsed;
      },
      tworeadings: function(_,parsed){
        var current = {
            timestamp: parsed.timestamp,
            waterLevel: parsed.waterLevel,
            tide: "unknown"
          };
        var previous = {
            timestamp: null,
            waterLevel: null,
            tide: "unknown"
          };
        if(_){
          previous.timestamp = _.current.timestamp;
          previous.waterLevel = _.current.waterLevel;
          previous.tide = _.current.tide;
          if(current.waterLevel == previous.waterLevel){
            current.tide = previous.tide;
          }else if (current.waterLevel > previous.waterLevel) {
            current.tide = "rising";
          }else {
            current.tide = "falling";
          }
        }
        return {
           current: current,
           previous: previous
        }
      },
      tide: function(_,tworeadings){
        if(tworeadings.previous == undefined){
          return _;
        }
        if(tworeadings.current.tide == tworeadings.previous.tide){
          return _;
        }
        if(tworeadings.previous.tide == "unknown"){
          return _;
        }
        var highlow = tworeadings.previous.tide == "rising"?"High":"Low";
        return {timestamp: tworeadings.previous.timestamp, waterLevel: tworeadings.previous.waterLevel, tide: highlow};
      }
  };
}

var forecast = function(station,elid,onModelReady){
  var d = new Date();
  d.setDate(d.getDate());
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 2);
  var end_date = d.toISOString();
    var url = 'http://erddap.marine.ie/erddap/tabledap/IMI-TidePrediction.json?time,Water_Level&time>='+start_date+'&time<='+end_date+'&stationID="'+station+'"';
    return new mi_charts_widget(elid,{
                namespace: "tide-forecast-"+station.replace(/[\s_]+/g, '-').toLowerCase(),
                title: "Tide Forecast",
                model: model(),
                stockcharts: [
                    {field: "waterLevel", title: "Tide Height", units: "m", show_reading: false}
                ],
                custom: [
                  {
                    field: "tide",
                    on: function(el,tide){
                      var tableid = el.id+"-hightides";
                      var eltable = document.getElementById(tableid);
                      if(eltable == null){
                        el.insertAdjacentHTML('beforeend','<table class="widget-table widget-text" id="'+tableid+'"></table>');
                        eltable = document.getElementById(tableid);
                      }
                      var td = new Date(tide.timestamp).toUTCString();
                      var date = td.substring(0,11);
                      var time = td.substring(17,22);
                      var date_changed = tide.timestamp?new Date(tide.timestamp).toUTCString().substring(0,11) != date : true;
                      var html = [];
                      html.push("<tr><td>")
                      if(date_changed){
                        html.push(date);
                      }
                      html.push("</td><td>"+time+"</td><td>"+tide.tide+"</td><td>"+tide.waterLevel+" m</td></tr>");
                      eltable.insertAdjacentHTML('beforeend',html.join(""));
                    }
                  }
                ],
                onModelReady: onModelReady,
                preload: {
                    url: url,
                    source: "table.rows",
                    target: "row"
                }
     });
};
exports.model = model;
exports.forecast = forecast;
