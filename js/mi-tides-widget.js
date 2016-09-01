'use strict';
var mi_charts_widget = require('./mi-chart-widget');
var model = function(){
    return {
      row: null,
      parsed: function(_,row){
         try{
          return {
               timestamp: Date.parse(row[0]),
               height: row[1]
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      height: function(parsed){
        return parsed;
      }
  };
}

var widget = function(station,elid,onModelReady){
  var d = new Date();
  d.setDate(d.getDate() - 2);
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 3);
  var end_date = d.toISOString();
    var url = '//erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.json?time,Water_Level&time>='+start_date+'&time<='+end_date+'&station_id="'+station+'"';
    return new mi_charts_widget(elid,{
                namespace: "tide-gauge-"+station.replace(/[\s_]+/g, '-').toLowerCase(),
                title: "Tide Gauge",
                model: model(),
                stockcharts: [
                    {field: "height", title: "Tide Height", units: "m"}
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
exports.widget = widget;
