'use strict';

const locations = require("./cil.locations").locations;
const metocean = require("./cil-metocean-widget");
var keys = Object.keys(locations);
var locs = [];
for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(locations[key].metocean){
      locs.push(locations[key]);
      exports[key] = {widget: metocean.widget.bind(this,locations[key])};
    }
}
exports.meta = {
  name: "MetOcean",
  description: 'Recorded data from Buoys and Lighthouses',
  components: metocean.components,
  locations: locs
};
