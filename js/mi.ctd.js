'use strict';

var locations = require('./mi.locations');
exports.spiddal = require('./mi-spiddal-ctd-widget');
exports.meta = {
  name: "Conductivity Temperature Depth Sensor"
};
exports.locations = [
  locations.spiddal
];
