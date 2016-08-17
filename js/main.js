'use strict';
var mqtt = require('mqtt');
var mqtt_feed = require('./mqtt-feed');
window.ido = window.ido || {};
window.ido.mi = window.ido.mi || {};
try{
  window.ido.mi.mqtt = window.ido.mi.mqtt || new mqtt_feed.wrap(mqtt.connect("http://mqtt.marine.ie"));
}catch(e){
  console.log("could not connect to mqtt feed http://mqtt.marine.ie",e);
}
window.ido.mi.spiddal = window.ido.mi.spiddal || {};
window.ido.mi.spiddal.ctd = require('./mi-spiddal-ctd-widget');
window.ido.mi.spiddal.fluorometer = require('./mi-spiddal-fluorometer-widget');

const tides = require('./mi-tides-widget');
window.ido.mi.tides = window.ido.mi.tides || {};
window.ido.mi.tides.galway = window.ido.mi.tides.galway || {};
window.ido.mi.tides.galway.gauge = window.ido.mi.tides.galway.gauge || tides.gauge.bind(this,"Galway Port");
const tidecast = require('./mi-tides-forecast-widget');

window.ido.mi.tides.sites = {
  galway: "Galway_Port",
  dublin: "Dublin_Port",
  howth: "Howth_Harbour",
  killybegs: "Killybegs_Port",
  malinhead: "Malin_Head",
  ballyglass: "Ballyglass",
  aranmore: "Aranmore",
  ballycotton: "Ballycotton",
};
{
  var keys = Object.keys(window.ido.mi.tides.sites);
  for(var i=0;i<keys.length;i++){
    window.ido.mi.tides[keys[i]] = window.ido.mi.tides[keys[i]] || {};
    window.ido.mi.tides[keys[i]].forecast = window.ido.mi.tides[keys[i]].forecast || tidecast.forecast.bind(this,window.ido.mi.tides.sites[keys[i]]);
  }
}


const waves = require('./mi-waves-widget');
window.ido.mi.waves = window.ido.mi.waves || {};
window.ido.mi.waves.galway = window.ido.mi.waves.galway || {};
window.ido.mi.waves.galway.gauge = window.ido.mi.waves.galway.gauge || waves.gauge.bind(this,"Galway Bay Wave Buoy");
