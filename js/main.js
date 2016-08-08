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
