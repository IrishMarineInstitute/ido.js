'use strict';
const waves = require('./mi-waves-widget');

var galway = {};
galway.widget = waves.gauge.bind(this,"Galway Bay Wave Buoy");

exports.galway = galway;
