'use strict';
var css = require('../css/main.css');
var mqtt = require('mqtt');
var mqtt_feed = require('./mqtt-feed');
window.ido = window.ido || {};
window.ido.mi = window.ido.mi || {};
try{
  window.ido.mi.mqtt = window.ido.mi.mqtt || new mqtt_feed.wrap(mqtt.connect("http://mqtt.marine.ie"));
}catch(e){
  console.log("could not connect to mqtt feed http://mqtt.marine.ie",e);
}
window.ido.mi.ctd = window.ido.mi.ctd || {};
window.ido.mi.ctd.spiddal = window.ido.mi.ctd.spiddal || require('./mi-spiddal-ctd-widget');

window.ido.mi.fluorometer = window.ido.mi.fluorometer || {};
window.ido.mi.fluorometer.spiddal = window.ido.mi.fluorometer.spiddal || require('./mi-spiddal-fluorometer-widget');

const tides = require('./mi-tides-widget');
const tidecast = require('./mi-tides-forecast-widget');
window.ido.mi.tides = window.ido.mi.tides || {};
window.ido.mi.tidesforecast = window.ido.mi.tidesforecast || {};

var tidesites = {
  galway: {tidesforecast:"Galway_Port", tides:"Galway Port"},
  dublin: {tidesforecast:"Dublin_Port", tides:"Dublin Port"},
  howth: {tidesforecast:"Howth_Harbour", tides:"Howth Harbour"},
  killybegs: {tidesforecast:"Killybegs_Port", tides:"Killybegs Port"},
  malinhead: {tidesforecast:"Malin_Head", tides:"Malin Head"},
  ballyglass: {tidesforecast:"Ballyglass", tides:"Ballyglass"},
  aranmore: {tidesforecast:"Aranmore", tides:"Aranmore"},
  ballycotton: {tidesforecast:"Ballycotton", tides:"Ballycotton"},
};
{
  var keys = Object.keys(tidesites);
  for(var i=0;i<keys.length;i++){
    window.ido.mi.tides[keys[i]] = window.ido.mi.tides[keys[i]] || {};
    window.ido.mi.tides[keys[i]].widget = window.ido.mi.tides[keys[i]].widget || tides.gauge.bind(this,tidesites[keys[i]].tides);
    window.ido.mi.tidesforecast[keys[i]] = window.ido.mi.tidesforecast[keys[i]] || {};
    window.ido.mi.tidesforecast[keys[i]].widget = window.ido.mi.tidesforecast[keys[i]].widget || tidecast.forecast.bind(this,tidesites[keys[i]].tidesforecast);
  }
}


const waves = require('./mi-waves-widget');
window.ido.mi.waves = window.ido.mi.waves || {};
window.ido.mi.waves.galway = window.ido.mi.waves.galway || {};
window.ido.mi.waves.galway.widget = window.ido.mi.waves.galway.widget || waves.gauge.bind(this,"Galway Bay Wave Buoy");



var docReady = require('doc-ready');
// find and load widgets on page.
docReady( function() {
  var pre = "_"+(new Date()).getTime()+"_";
  var n = 0;
  var elements = document.getElementsByClassName("ido-widget");
  for (i = 0; i < elements.length; i++) {
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
