'use strict';

var locations = require('./mi.locations').locations;
const forecast = require('./mi-tides-forecast-widget');

exports.aranmore = { widget: forecast.widget.bind(this,"Aranmore")};
exports.ballycotton ={ widget:  forecast.widget.bind(this,"Ballycotton")};
exports.ballyglass = { widget: forecast.widget.bind(this,"Ballyglass")};
exports.castletownbere = {widget: forecast.widget.bind(this,"Castletownbere")};
exports.dublinport = { widget: forecast.widget.bind(this,"Dublin_Port")};
exports.dundalk = {widget: forecast.widget.bind(this,"Dundalk")};
exports.dunmoreeast = {widget: forecast.widget.bind(this,"Dunmore_East")};
exports.galwayport = { widget: forecast.widget.bind(this,"Galway_Port")};
exports.howthharbour = { widget: forecast.widget.bind(this,"Howth")};
exports.inishmore = {widget: forecast.widget.bind(this,"Inishmore")};
exports.killybegsport = { widget: forecast.widget.bind(this,"Killybegs")};
exports.kishbanklighthouse = {widget: forecast.widget.bind(this,"Kish_Bank_Lighthouse")};
exports.malinhead = { widget: forecast.widget.bind(this,"Malin_Head")};
exports.skerries = {widget: forecast.widget.bind(this,"Skerries")};
exports.sligo = {widget: forecast.widget.bind(this,"Sligo")};
exports.wexford = {widget: forecast.widget.bind(this,"Wexford")};

exports.meta = {
  name: "Tides Forecast",
  description: 'Irish Tides Forecast',
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
