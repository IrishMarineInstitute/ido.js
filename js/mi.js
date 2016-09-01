'use strict';
var mqtt = require('mqtt');
var mqtt_feed = require('./mqtt-feed');
var mi = {};
try{
  mi.mqtt = new mqtt_feed.wrap(mqtt.connect("wss://mqtt.marine.ie"));
}catch(e){
  console.log("could not connect to mqtt feed wss://mqtt.marine.ie",e);
}

exports.mqtt = mi.mqtt
exports.ctd = require("./mi.ctd");
exports.fluorometer = require('./mi.fluorometer');
exports.tidesforecast = require('./mi.tidesforecast');
exports.tides = require('./mi.tides');
exports.waves = require('./mi.waves');

exports.meta = {
  key:"mi",
  name: "Irish Marine Institute",
  description: "The State agency responsible for marine research, \
  technology development and innovation in Ireland. We provide \
  scientific and technical advice to Government to help inform \
  policy and to support the sustainable development of Ireland's \
  marine resource.",
  url: "http://www.marine.ie",
  icon: "http://webapps.marine.ie/virtual_earth_polygon/Images/MISymbol.bmp",
  logo: "http://www.marine.ie/Home/sites/default/files/MIFiles/Images/General/Marine_logo.jpg",
  types:  [ "ctd","fluorometer","tidesforecast","tides","waves" ]
}
