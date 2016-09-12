'use strict';
var uidocs = require('./docs-widget.js');
var parser = require('./hashparser');
var applyWidgets = function(root) {
  root = root || document;
  var pre = "_"+(new Date()).getTime()+"_";
  var n = 0;
  var elements = root.getElementsByClassName("ido-widget");
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    if(el.hasAttribute("data-widget")){
      var elid =  "ido_widget"+pre+n++;
      el.innerHTML = "<div id='"+elid+"'></div>";
      var wanted = "" + el.getAttribute("data-widget");
      if(wanted == "documentation"){
        ido.documentation(ido,el);
        continue;
      }else if (wanted == "custom") {
        if(el.hasAttribute("data-components")){
          el.innerHTML = ido.str2widgetHTML(""+el.getAttribute("data-components"));
          ido.applyWidgets(el);
        }
        continue;
      }
      var parts = wanted.split(/\./);
      var path = window.ido;
      for(var j=0;j<parts.length;j++){
        if(path){
          path = path[parts[j]];
        }
      }
      var options = {};
      if(el.hasAttribute("data-components")){
        var components = (""+el.getAttribute("data-components")).split(",");
        for(var k=0;k<components.length;k++){
          components[k] = components[k].trim();
        }
        if(components.length){
          options.components = components;
        }
      }
      if(path && path.widget){
        path.widget("#"+elid,options);
      }else{
        console.log("no widget found for "+wanted);
      }
    }
  }
};
var str2widgetHTML = function(str){
    var wanted = parser.parse(str);
    if(!(wanted && wanted.length)){
      return "";
    }
    var lookup = {};
    for(var p=0;p<ido.meta.providers.length;p++){
      var provider = ido[ido.meta.providers[p]];
      for(var t=0;t<provider.meta.types.length;t++){
        var typekey = provider.meta.types[t];
        var type = provider[typekey];
        for(var l=0;l<type.meta.locations.length;l++){
          var loc = type.meta.locations[l];
          lookup[loc.key] = lookup[loc.key] || {};
          lookup[loc.key][typekey] = lookup[loc.key][typekey] || {};
          lookup[loc.key][typekey][provider.meta.key] = type;
        }
      }
    }
    var html = [];
    for(var i=0;i<wanted.length;i++){
      var loc = lookup[wanted[i].key];
      if(loc){
        var allwidgets = [];
        var keys = Object.keys(loc);
        for(var j=0;j<keys.length;j++){
          allwidgets.push({key:keys[j]});
        }
        var widgets = wanted[i].widgets || [];
        if(widgets.length == 0){
          widgets = allwidgets
        };
        for(var j=0;j<widgets.length;j++){
          var widget = widgets[j];
          var providers = Object.keys(loc[widget.key]||{});
          for(var p=0;p<providers.length;p++){
            var provider = providers[p];
            var widget_key = provider+"."+widget.key+"."+wanted[i].key;
            html.push("<div class='ido-widget' data-widget='"+widget_key+"'");
            if(widget.components && widget.components.length){
              html.push(" data-components='");
              html.push(widget.components.join(","));
              html.push("'")
            }
            html.push("></div>");
          }
        }
      }
    }
    return html.join("");
};

var docReady = function(e){e();};
if(typeof window !== 'undefined'){
  docReady = require('doc-ready');
}
var providers = [];
var mi = require('./mi/mi.js');
providers.push(mi);
exports.mi = mi
var cil = require("./cil/cil.js")
providers.push(cil);
exports.cil = cil

exports.meta = {
  name: "Irish Digital Ocean API",
  description: "A collection of services for displaying live and \
  archived data about Ireland's Marine Environment",
  providers: ["mi","cil"]
};
exports.documentation = uidocs.documentation;

exports.applyWidgets = function(root){
  docReady(applyWidgets.bind(this,root));
};
exports.locations = function(){
  var seen = {};
  var answer = [];
  for(var i=0;i<providers.length;i++){
    var locations = providers[i].meta.locations;
    var keys = Object.keys(locations);
    for(var j=0;j<keys.length;j++){
      var l = locations[keys[j]];
      if(!seen[l.key]){
        seen[l.key] = true;
        answer.push(l);
      }
    }
  }
  return answer.sort(function(a, b) {
        return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
    });
}
exports.str2widgetHTML = str2widgetHTML;
