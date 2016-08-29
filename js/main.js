'use strict';
var css = require('../css/main.css');
window.ido = window.ido || {};
window.ido.mi = window.ido.mi || require('./mi.js');


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
      var parts = wanted.split(/\./);
      var path = window.ido;
      for(var j=0;j<parts.length;j++){
        if(path){
          path = path[parts[j]];
        }
      }
      if(path && path.widget){
        path.widget("#"+elid);
      }else{
        console.log("no widget found for "+wanted);
      }
    }
  }
});
