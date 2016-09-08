'use strict';
// parses something like this:
//galwaybay[tides(height),tidesforecast],dublinport,killybegs[tides]
var consume = function(chars,pos,char){
  while(pos<chars.length && chars[pos] == char){
    pos++;
  }
  return pos;
}
var parseComponents = function(chars,pos){
  var components = [];
  var component = "";
  var done = false;
  while(pos<chars.length && !done){
    var c = chars[pos++];
    switch(c){
    case ')':
      done = true;
      break;
    case ',':
      if(component.length){
        components.push(component);
        component = "";
      }
      pos = consume(chars,pos,',');
      break;
    default:
      component += c;
    }
  }
  if(component.length){
    components.push(component);
  }
  return [pos,components.length?components:undefined];
}
var parseWidgets = function(chars,pos){
  var widgets = [];
  var done = false;
  var widget = {key:"",components:[]};
  while(pos<chars.length && !done){
    var c = chars[pos++];
    switch(c){
      case '(':
        var result = parseComponents(chars,pos);
        pos = result[0];
        widget.components = result[1];
        widgets.push(widget);
        widget = {key:"",components:[]};
        break;
      case ',':
        pos = consume(chars,pos,',');
        if(widget.key.length){
          widgets.push(widget);
        }
        widget = {key:"",components:[]};
        break;
      case ']':
        done = true;
        break;
      default:
        widget.key += c;
    }
  }
  if(widget.key.length){
    widgets.push(widget);
  }
  return [pos,widgets.length?widgets:undefined];
}
var parseLocation = function(chars,pos){
  var loc = {key:"",widgets:[]};
  var done = false;
  while(pos<chars.length && !done){
    var c = chars[pos++];
    switch(c){
      case '[':
         var result = parseWidgets(chars,pos);
         pos = result[0];
         loc.widgets = result[1];
         pos = consume(chars,pos,',');
         done = true;
         break;
      case ',':
        pos = consume(chars,pos,',');
        done = true;
        break;
      default:
        loc.key += c;
    }
  }
  return [pos,loc];
}
var parse = function(input){
  var chars = input.replace(/\s/g, '').replace(/^#/,'').split("");
  var locations = [], pos = 0;
  while(pos<chars.length){
    var result = parseLocation(chars,pos);
    pos = result[0];
    locations.push(result[1]);
    pos = consume(chars,pos,',');
  }
  return locations;
}

exports.parse = parse;
