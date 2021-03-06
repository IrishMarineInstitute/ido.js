'use strict';
var Highcharts = require('highcharts/highstock');
var Exceliot = require("./exceliot");
if( typeof window !== 'undefined' ){
var chartoptions = require('./mi-chart-options');
  chartoptions.configure(Highcharts);
}

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
    if(title){
        html.push(" <span style='position:absolute; left: 10px; bottom:0;'>");
        html.push(" <span style='font-size: 18px; color: #555'>");
        html.push(title);
        html.push("</span>");
        html.push(" </span>");
    }
    html.push(" <span style='position:absolute; right:10px; bottom:0;'>");
    html.push("   <span id='"+el_id+"_latest' class='chart-latest-value'></span>")
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
  getWidgetContainerHtml: function(namespace,location,title,latest){
    var html=[];
    html.push("<div>");
    html.push(" <div class='widget-clean'>");
    if(location || (title && title.length)){
      html.push(" <div class='widget-header'>");
      if(location){
        html.push(" <div class='widget-title'>");
        html.push(location.name);
        html.push(" </div>");
      }
      if(title && title.length){
        html.push(" <div class='widget-title'>");
        html.push(title);
        html.push(" </div>");
      }
      html.push(" </div>");
    }
    html.push(" <div id='"+namespace+"-widget-body' class='widget-body'>");
    if(latest){
      html.push(" <h5 style='text-align: center; margin: 20px;'>");
      html.push(" Latest Reading: <span id='"+namespace+"-latest-reading'></span> (UTC)");
      html.push(" </h5>");
    }

    html.push(" </div>");
    html.push(" </div>");
    html.push("</div>");
    return html.join("");
   },
    createChart: function(model,namespace,params){
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



        var chart = Highcharts.StockChart(Highcharts.merge(Highcharts.theme, {
            yAxis: { title: { text: ' ' }, opposite: false, floor: 0, gridLineWidth: 0, minorGridLineWidth: 0, labels: { enabled: false } },
            series: [{name: displayTitle, data:[]}],
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
        model.on(field,function(show_reading,val){
           var shift = chart.series[0].length >= 4000;
           var value = val[field];
           if(value === undefined){
             return;
           }
           chart.series[0].addPoint([val.timestamp,value], true, shift);
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
    },
    createCustom: function(model,namespace,params){
      var field = params.field;
      var elementId = namespace+"_"+field+"_custom_"+ new Date().getTime()*1000;
      var html = '<div id="'+elementId+'" ></div>';
      document.getElementById(namespace+"-widget-body").insertAdjacentHTML('beforeend',html);
      var el = document.getElementById(elementId);
      model.on(field,params.on.bind(null,el));

    },
   renderWidgetContainerHtml: function(){
      var el = undefined;
      if(this.elid.indexOf("#") == 0){
        el = document.getElementById(this.elid.substring(1));
      }
      if(el){
        el.innerHTML = this.getWidgetContainerHtml(this.namespace,this.options.location,this.title,this.options.latest === false?false:true);
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
      // are any custom divs?
      if(this.options.custom){
        for(var i=0;i<this.options.custom.length;i++){
          this.createCustom(this.model,this.namespace,this.options.custom[i]);
        }
      }

      // Is there a standard timestamp field?
      if(this.options.model.timestamp){
       this.model.on("timestamp",function(val){
          var el = document.getElementById(this.namespace+"-latest-reading");
          if(el) el.innerText = new Date(val).toUTCString().substr(17, 9);
       }.bind(this));
      }

      // should we subscribe to a live feed?
      var subscribe_fn = undefined;
      if(typeof ido == 'undefined' || ido.mi == null || ido.mi.mqtt == null){
        console.log("not connected for mqtt");
      }else if(this.options.mqtt){
       subscribe_fn =
         function(model,mqtt){
           //console.log("subscribing to mqtt topic "+mqtt.topic);
           ido.mi.mqtt.on(mqtt.topic, function(topic,payload){
                model.set(mqtt.target,payload.toString());
             });
         }.bind(null,this.model,this.options.mqtt);
       }

      var makeChartsVisibleAndCallUserCallback = function(){
             for(var j=0;j<charts.length;j++){
               if(charts[j]){
                 for(var n=0;n<charts[j].series.length;n++){
                   charts[j].series[n].setVisible(true,true);
                 }
               }
             }
             setTimeout(subscribe_fn,0);
       };

       // Is any data to be preloaded by ajax?
       if(this.options.preload){
        this.ajax(this.options.preload.url, function(data){
          var parts = this.options.preload.source.split(".");
          for(var i=0;i<parts.length;i++){
            if(data){
              data = data[parts[i]];
            }
          }
          if(data == undefined){
            console.log("No data found for key "+this.options.preload.source);
            setTimeout(makeChartsVisibleAndCallUserCallback,0);
            return;
          }
           for(var i=0;i<data.length;i++){
             this.model.set(this.options.preload.target,data[i],(function(n){
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
