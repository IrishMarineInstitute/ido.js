'use strict';
var mi_charts_widget = require('../mi-chart-widget');
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
        return {timestamp:parsed.timestamp, waterLevel: parsed.waterLevel};
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
        var previousTimestamp = _ ? _.timestamp : false;
        return {timestamp: tworeadings.previous.timestamp, previousTimestamp: previousTimestamp, waterLevel: tworeadings.previous.waterLevel, tide: highlow};
      }
  };
}
var get_custom_latest = function(){
  return {
                      field: "tide",
                      on: function(el,tide){
                        var tableid = el.id+"-hightides";
                        var eltable = document.getElementById(tableid);
                        if(eltable == null){
                          el.insertAdjacentHTML('beforeend','<table class="table table-condensed table-striped" id="'+tableid+'"></table>');
                          eltable = document.getElementById(tableid);
                        }
                        var td = new Date(tide.timestamp).toUTCString();
                        var date = td.substring(0,11);
                        var time = td.substring(17,22);
                        var date_changed = tide.previousTimestamp?new Date(tide.previousTimestamp).toUTCString().substring(0,11) != date : true;
                        var html = [];
                        html.push("<tr><td>")
                        if(date_changed){
                          html.push(date);
                        }
                        html.push("</td><td>"+time+"</td><td>"+tide.tide+"</td><td>"+tide.waterLevel+" m</td></tr>");
                        eltable.insertAdjacentHTML('beforeend',html.join(""));
                      }
                    };
}
var widget = function(location,station,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","height","tides"];
  var stockcomponents = {
    "height": {field: "waterLevel", title: "Forecast Tide Height", units: "m", show_reading: false}
  }
  var customcomponents = {
    "tides": get_custom_latest()
  }
  var custom = [];
  var stockcharts = [];
  var components = {};
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
    wanted = customcomponents[options.components[i]];
    if(wanted) custom.push(wanted);
  }

  var d = new Date();
  d.setDate(d.getDate());
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 2);
  var end_date = d.toISOString();
    var url = '//erddap.marine.ie/erddap/tabledap/IMI-TidePrediction.json?time,Water_Level&time>='+start_date+'&time<='+end_date+'&stationID="'+station+'"';
    return new mi_charts_widget(elid,{
                namespace: "tide-forecast-"+station.replace(/[\s_]+/g, '-').toLowerCase(),
                title: components.title?"Tide Forecast":false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                custom: custom,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: url,
                    source: "table.rows",
                    target: "row"
                }
     });
};
exports.model = model;
exports.widget = widget;
