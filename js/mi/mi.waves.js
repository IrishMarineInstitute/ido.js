'use strict';
const waves = require('./mi-waves-widget');
var locations = require('./mi.locations').locations;

exports.belmulletbertha = { widget:waves.widget.bind(this,locations.belmulletbertha,"Belmullet Wave Buoy Berth A")};
exports.belmulletberthb = { widget:waves.widget.bind(this,locations.belmulletberthb,"Belmullet Wave Buoy Berth B")};
exports.galwayport = { widget:waves.widget.bind(this,locations.galwayport,"Galway Bay Wave Buoy")};
exports.westwavemk3 = { widget:waves.widget.bind(this,locations.westwavemk3,"Westwave MK3")};
exports.meta = {
  name: "Waves",
  description: 'Data from the Irish Waves Buoy Network',
  components: ["location","title","latest","temperature","height"],
  locations: [
    locations.belmulletbertha,
    locations.belmulletberthb,
    locations.galwayport,
    locations.westwavemk3
  ]
};
