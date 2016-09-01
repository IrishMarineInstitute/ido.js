'use strict';

var locations = require('./mi.locations').locations;
exports.galwaybay = require('./mi-spiddal-fluorometer-widget');
exports.meta = {
  name: "Fluorometer Sensor",
  description: 'A fluorometer measures the fluorescence of the seawater \
    to give an estimate of the volume of chlorophyll present \
    (indicative of the amount of phytoplankton in the seawater) \
    and it measures turbidity, or the "cloudiness" of the seawater, \
    caused by the presence of particles such as sediment from \
    the seabed suspended in the water.',
    features: ["latest","chlorophyll","turbidity"],
  locations: [
    locations.galwaybay
  ]
};
