'use strict';
var css = require('../css/main.css');
var ido = require('./ido.js');

var docReady = require('doc-ready');
// find and load widgets on page.
docReady(ido.applyWidgets);
window.ido = ido;
