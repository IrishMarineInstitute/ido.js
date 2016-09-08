'use strict';
var ido = require('./ido.js');

if(typeof window !== 'undefined'){
  var css = require('../css/main.css');
  window.ido = ido;
  var docReady = require('doc-ready');
  docReady(ido.applyWidgets);
}
exports.ido = ido;
