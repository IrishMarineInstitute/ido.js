'use strict';
var uidocs = require('./docs-widget.js');
exports.mi = require('./mi/mi.js'),
exports.meta = {
  name: "Irish Digital Ocean API",
  description: "A collection of services for displaying live and \
  archived data about Ireland's Marine Environment",
  providers: ["mi"]
}
exports.documentation = uidocs.documentation;
