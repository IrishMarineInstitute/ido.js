'use strict';

const tidecast = require('./mi-tides-forecast-widget');
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
var keys = Object.keys(tidesites);
for(var i=0;i<keys.length;i++){
    var x = {};
    x.widget = tidecast.forecast.bind(this,tidesites[keys[i]].tidesforecast);
    exports[keys[i]] = x
}
