'use strict';

var locations = require('./mi.locations').locations;
const ctd = require('./mi-spiddal-ctd-widget');
exports.galwaybay = {widget: ctd.widget.bind(this,locations.galwaybay)};
exports.meta = {
  name: "Conductivity Temperature Depth Sensor",
  description: 'A Conductivity/Temperature/Depth sensor measures the \
  temperature and conductivity of the seawater (the conductivity is \
  used to calculate an estimate of the salinity); the pressure \
  exert by the seawater above (from which the depth of the sensor is \
  estimated); and these parameters are also used to estimate the \
  speed of sound within the sea.',
  components: ["location","title","latest","temperature","pressure","conductivity","soundVelocity"],
  locations: [
    locations.galwaybay
  ]
};
