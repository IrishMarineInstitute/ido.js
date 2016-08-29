'use strict';
var mqtt = require('mqtt');
var mqtt_feed = require('./mqtt-feed');
var mi = {};
try{
  mi.mqtt = new mqtt_feed.wrap(mqtt.connect("http://mqtt.marine.ie"));
}catch(e){
  console.log("could not connect to mqtt feed http://mqtt.marine.ie",e);
}

exports.mqtt = mi.mqtt
exports.ctd = require("./mi.ctd");
exports.fluorometer = require('./mi.fluorometer');
exports.tidesforecast = require('./mi.tidesforecast');
exports.tides = require('./mi.tides');
exports.waves = require('./mi.waves');

exports.types = [
  {key: "ctd", name: exports.ctd.meta.name},  
]
