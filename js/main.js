'use strict';
var css = require('../css/main.css');
var ido = require('./ido.js');




var docReady = require('doc-ready');
// find and load widgets on page.
docReady( function() {
  var pre = "_"+(new Date()).getTime()+"_";
  var n = 0;
  var elements = document.getElementsByClassName("ido-widget");
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    if(el.hasAttribute("data-widget")){
      var elid =  "ido_widget"+pre+n++;
      el.innerHTML = "<div id='"+elid+"'></div>";
      var wanted = "" + el.getAttribute("data-widget");
      if(wanted == "documentation"){
        ido.documentation(ido,el);
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
      if(el.hasAttribute("data-features")){
        var features = (""+el.getAttribute("data-features")).split(",");
        for(var k=0;k<features.length;k++){
          features[k] = features[k].trim();
        }
        if(features.length){
          options.features = features;
        }
      }
      if(path && path.widget){
        path.widget("#"+elid,options);
      }else{
        console.log("no widget found for "+wanted);
      }
    }
  }
});
window.ido = ido;
