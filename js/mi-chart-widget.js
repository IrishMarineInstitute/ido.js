'use strict';
var Highcharts = require('highcharts/highstock');
var Exceliot = require("./exceliot");
var chartoptions = require('./mi-chart-options');
chartoptions.configure(Highcharts);

var mi_chart_widget = function(element_id,options){
  this.elid = element_id;
  this.namespace = options.namespace;
  this.title = options.title;
  this.model = new Exceliot().register(options.namespace,options.model);
  this.options = options;
  this.apply();
};
mi_chart_widget.prototype = {
     ajax: function(url,fn,errorcb){
     var request = new XMLHttpRequest();
     request.open('GET', url, true);
     request.onload = function() {
       if (request.status >= 200 && request.status < 400) {
         var data = JSON.parse(request.responseText);
         fn(data);
       }else{
         errorcb();
       }
     };
    request.addEventListener("error",errorcb);
    request.send();
   },

  getWidgetElementHtml: function(el_id,title,units){
    var html = [];
    html.push("<div>");
    html.push("<div style='height:40px; position:relative;'>");
    html.push(" <span style='position:absolute; left: 10px; bottom:0;'>");
    html.push(" <span style='font-size: 18px; color: #555'>");
    html.push(title);
    html.push("</span>");
    html.push(" </span>");
    html.push(" <span style='position:absolute; right:10px; bottom:0;'>");
    html.push("   <span id='"+el_id+"_latest' class='chart-latest-value'>00.00</span>")
    html.push("   <span class='chart-latest-units'>"+units+"</span>");
    html.push(" </span>");
    html.push("</div>");
    html.push("<div class='chart-container-clean'>");
    html.push(" <div id='"+el_id+"' class='chart-body'>");
    html.push(" </div>");
    html.push("</div>");
    html.push("</div>");

    return html.join("");
  },
  getWidgetContainerHtml: function(namespace,title){
    var html=[];
    html.push("<div>");
    html.push(" <div class='widget-clean'>");
    html.push(" <div class='widget-header'>");
    html.push(" <div class='widget-title'>");
    html.push(title);
    html.push(" </div>");
    html.push(" </div>");

    html.push(" <div id='"+namespace+"-widget-body' class='widget-body'>");

    html.push(" <h5 style='text-align: center; margin: 20px;'>");
    html.push(" Latest Reading: <span id='"+namespace+"-latest-reading'></span> (UTC)");
    html.push(" </h5>");

    html.push(" </div>");
    html.push(" </div>");
    html.push("</div>");
    return html.join("");
   },
    createChart: function(model,namespace,params){
       var field = params.field;
       var displayTitle = params.title;
       var displayUnits = params.units;

       var chartElementId = namespace+"_"+field+"_chart";
       var html = this.getWidgetElementHtml(chartElementId,displayTitle,displayUnits);
      try{
        document.getElementById(namespace+"-widget-body").insertAdjacentHTML('beforeend',html);
        var chart = Highcharts.StockChart(Highcharts.merge(Highcharts.theme, {
            yAxis: { title: { text: ' ' }, opposite: false, floor: 0, gridLineWidth: 0, minorGridLineWidth: 0, labels: { enabled: false } },
            series: [{name: displayTitle, data:[]}],
            plotOptions: { turboThreshold: 10000 },
            tooltip: {
                shared: true,
                valueDecimals: 3,

                valueSuffix: " (" + params.units + ")"
            },
            chart: {
               renderTo: chartElementId
             }
         }));
        chart.series[0].setVisible(false,false);
        model.on(field,function(val){
           var shift = chart.series[0].length >= 4000;
           var value = val[field];
           chart.series[0].addPoint([val.timestamp,value], true, shift);
           try{
             value  = value.toFixed(3);
           }catch(e){}
           document.getElementById(chartElementId+"_latest").innerText = value;
        });
        return chart;
       }catch(e){
          console.log(e);
       }
    },
   renderWidgetContainerHtml: function(){
      var el = undefined;
      if(this.elid.startsWith("#")){
        el = document.getElementById(this.elid.substring(1));
      }
      if(el){
        el.innerHTML = this.getWidgetContainerHtml(this.namespace,this.title);
      }else{
        console.log("could not find element ["+this.elid+"] for "+this.namespace+" widget");
        return;
      }
    },

    apply: function(){
      this.renderWidgetContainerHtml();
      var charts = [];

      // are any stockcharts wanted?
      if(this.options.stockcharts){
        for(var i=0;i<this.options.stockcharts.length;i++){
          charts.push(this.createChart(this.model,this.namespace,this.options.stockcharts[i]));
        }
      }

      // Is there a standard timestamp field?
      if(this.options.model.timestamp){
       this.model.on("timestamp",function(val){
          document.getElementById(this.namespace+"-latest-reading").innerText = new Date(val).toUTCString().substr(17, 9);
       }.bind(this));
      }

      // should we subscribe to a live feed?
      var subscribe_fn = undefined;
      if(typeof ido == 'undefined' || ido.mi == null || ido.mi.mqtt == null){
        console.log("not connected for mqtt");
      }else if(this.options.mqtt){
       subscribe_fn =
         function(model,mqtt){
           console.log("subscribing to mqtt topic "+mqtt.topic);
           ido.mi.mqtt.on(mqtt.topic, function(topic,payload){
                model.set(mqtt.target,payload.toString());
             });
         }.bind(null,this.model,this.options.mqtt);
       }

      var makeChartsVisibleAndCallUserCallback = function(){
             for(var j=0;j<charts.length;j++){
               if(charts[j]){
                  charts[j].series[0].setVisible(true,true);
               }
             }
             setTimeout(subscribe_fn,0);
       };

       // Is any data to be preloaded by ajax?
       if(this.options.preload){
        this.ajax(this.options.preload.url, function(json){
           for(var i=0;i<json.data.length;i++){
             this.model.set(this.options.preload.target,json[this.options.preload.source][i],(function(n){
                  if(n == i-1){ // done now.
                     setTimeout(makeChartsVisibleAndCallUserCallback,0);
                  }
              }).bind(this,i));
          }
        }.bind(this),makeChartsVisibleAndCallUserCallback);
      }else{
        setTimeout(makeChartsVisibleAndCallUserCallback,0);
      }
    }
  };
  module.exports = mi_chart_widget;
