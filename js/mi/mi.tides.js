'use strict';

var locations = require('./mi.locations').locations;
const tides = require('./mi-tides-widget');
exports.aranmore = { widget: tides.widget.bind(this,locations.aranmore,"Aranmore")};
exports.ballycotton = { widget: tides.widget.bind(this,locations.ballycotton,"Ballycotton")};
exports.ballyglass = { widget: tides.widget.bind(this,locations.ballyglass,"Ballyglass")};
exports.dublinport = { widget: tides.widget.bind(this,locations.dublinport,"Dublin Port")};
exports.galwayport = { widget: tides.widget.bind(this,locations.galwayport,"Galway Port")};
exports.howthharbour = { widget: tides.widget.bind(this,locations.howthharbour,"Howth Harbour")};
exports.killybegsport = { widget: tides.widget.bind(this,locations.killybegsport,"Killybegs Port")};
exports.malinhead = { widget: tides.widget.bind(this,locations.malinhead,"Malin Head")};

exports.meta = {
  name: "Tides",
  description: 'Recorded data from the Irish Tides Network',
  components: ["location","title","latest","height"],
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
