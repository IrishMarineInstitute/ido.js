'use strict';

var locations = require('./mi.locations').locations;
const forecast = require('./mi-tides-forecast-widget');

exports.aranmore = { widget: forecast.widget.bind(this,locations.aranmore,"Aranmore")};
exports.ballycotton ={ widget:  forecast.widget.bind(this,locations.ballycotton,"Ballycotton")};
exports.ballyglass = { widget: forecast.widget.bind(this,locations.ballyglass,"Ballyglass")};
exports.castletownbere = {widget: forecast.widget.bind(this,locations.castletownbere,"Castletownbere")};
exports.dublinport = { widget: forecast.widget.bind(this,locations.dublinport,"Dublin_Port")};
exports.dundalk = {widget: forecast.widget.bind(this,locations.dundalk,"Dundalk")};
exports.dunmoreeast = {widget: forecast.widget.bind(this,locations.dunmoreeast,"Dunmore_East")};
exports.galwayport = { widget: forecast.widget.bind(this,locations.galwayport,"Galway_Port")};
exports.howthharbour = { widget: forecast.widget.bind(this,locations.howthharbour,"Howth")};
exports.inishmore = {widget: forecast.widget.bind(this,locations.inishmore,"Inishmore")};
exports.killybegsport = { widget: forecast.widget.bind(this,locations.killybegsport,"Killybegs")};
exports.kishbanklighthouse = {widget: forecast.widget.bind(this,locations.kishbanklighthouse,"Kish_Bank_Lighthouse")};
exports.malinhead = { widget: forecast.widget.bind(this,locations.malinhead,"Malin_Head")};
exports.skerries = {widget: forecast.widget.bind(this,locations.skerries,"Skerries")};
exports.sligo = {widget: forecast.widget.bind(this,locations.sligo,"Sligo")};
exports.wexford = {widget: forecast.widget.bind(this,locations.wexford,"Wexford")};

exports.meta = {
  name: "Tides Forecast",
  description: 'Irish Tides Forecast',
  components: ["location","title","latest","height","tides"],
  locations: [
    locations.aranmore,
    locations.ballyglass,
    locations.ballycotton,
    locations.galwayport,
    locations.dublinport,
    locations.dundalk,
    locations.dunmoreeast,
    locations.inishmore,
    locations.howthharbour,
    locations.killybegsport,
    locations.kishbanklighthouse,
    locations.malinhead,
    locations.skerries,
    locations.sligo,
    locations.wexford,
  ]
};
