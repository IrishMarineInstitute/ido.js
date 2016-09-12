'use strict';

const locations = require("./cil.locations").locations;

exports.metocean = require("./cil.metocean");
exports.meta = {
  key:"cil",
  name: "Commissioner of Irish Lights",
  description: "We are a maritime organisation \
  delivering an essential safety service around \
  the coast of Ireland, protecting the marine environment, \
  and supporting the marine industry and coastal communities.",
  url: "http://www.irishlights.ie/",
  icon: null,
  logo: "http://www.irishlights.ie/media/48896/IrishLights.png",
  types:  [ "metocean" ],
  locations: locations,
}
