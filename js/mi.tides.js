'use strict';

var locations = require('./mi.locations').locations;
const tides = require('./mi-tides-widget');
exports.aranmore = { widget: tides.widget.bind(this,"Aranmore")};
exports.ballycotton = { widget: tides.widget.bind(this,"Ballycotton")};
exports.ballyglass = { widget: tides.widget.bind(this,"Ballyglass")};
exports.dublinport = { widget: tides.widget.bind(this,"Dublin Port")};
exports.galwayport = { widget: tides.widget.bind(this,"Galway Port")};
exports.howthharbour = { widget: tides.widget.bind(this,"Howth Harbour")};
exports.killybegsport = { widget: tides.widget.bind(this,"Killybegs Port")};
exports.malinhead = { widget: tides.widget.bind(this,"Malin Head")};

exports.meta = {
  name: "Tides",
  description: 'Recorded data from the Irish Tides Network',
  locations: [
    locations.aranmore,
    locations.ballycotton,
    locations.ballyglass,
    locations.dublinport,
    locations.galwayport,
    locations.howthharbour,
    locations.killybegsport,
    locations.malinhead,
  ]
};
