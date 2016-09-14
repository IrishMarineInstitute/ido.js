'use strict';
const Highcharts = require('highcharts/highstock');
const mi_chart_widget = require('./mi-chart-widget');

var chart_widget = function(element_id,options){
  mi_chart_widget.call(this,element_id,options);
}

// subclass extends superclass
chart_widget.prototype = Object.create(mi_chart_widget.prototype);
chart_widget.prototype.constructor = chart_widget;

chart_widget.prototype.createBasicChart = chart_widget.prototype.createChart;

chart_widget.prototype.createSpeedDirectionChart = function(model,namespace,params){
  //This is not in use yet. Some work needs done and possible refactor.
   var field = params.field;
   var displayTitle = params.title;
   var displayUnits = params.units;
   var show_reading = params.show_reading === false?false:true;

   var chartElementId = namespace+"_"+field+"_chart";
   var html = this.getWidgetElementHtml(chartElementId,displayTitle,show_reading?displayUnits:"");
  try{
    document.getElementById(namespace+"-widget-body").insertAdjacentHTML('beforeend',html);
    var e = document.createElement('div');
    e.innerHTML = params.units;
    var units = e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;

    var chart = Highcharts.StockChart(Highcharts.merge(Highcharts.windTheme, {
        //xAxis: {offset: 5 },
        yAxis: { title: { text: ' ' }, opposite: false, floor: 0, gridLineWidth: 0, minorGridLineWidth: 0, labels: { enabled: false } },
        series: [{name: displayTitle, data:[]},{name: displayTitle+"yyy", data:[]}],
        plotOptions: { turboThreshold: 10000 },
        tooltip: {
            shared: true,
            valueDecimals: 3,

            valueSuffix: " (" + units + ")"
        },
        chart: {
           renderTo: chartElementId
         }
     }));
    chart.series[0].setVisible(false,false);
    chart.series[1].setVisible(false,false);

    model.on(field,function(show_reading,val){
       var shift = chart.series[0].length >= 4000;
       var value = val[field];
       if(value === undefined){
         return;
       }
       chart.series[0].addPoint([val.timestamp,value], true, shift);
       chart.series[1].addPoint([val.timestamp,value], true, shift);
       if(show_reading){
         try{
           value  = value.toFixed(3);
         }catch(e){}
         var el = document.getElementById(chartElementId+"_latest");
         if(el) el.innerText = value;
       }
    }.bind(null,show_reading));
    return chart;
   }catch(e){
      console.log(e);
   }
};

chart_widget.prototype.createChart = function(model,namespace,params){
  console.log("choosing a chart type");
  if(params.speed && params.direction){
    return this.createSpeedDirectionChart(model,namespace,params);
  }else{
    return this.createBasicChart(model,namespace,params);
  }
};

module.exports = chart_widget;
