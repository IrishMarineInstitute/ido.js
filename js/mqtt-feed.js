'use strict';
var wrap = function(client){
  this.client = client;
  this.handlers = {};
  this.client.on("message", function(topic,payload){
     this.handle_message(topic,payload);
  }.bind(this));
};
wrap.prototype = {
    on: function(topic,handler){
      var subscribe = false;
      if(this.handlers[topic] == undefined){
        subscribe = true;
        this.handlers[topic] = [];
      }
      this.handlers[topic].push(handler);
      if(subscribe){
        this.client.subscribe(topic);
      }
    },
    handle_message: function(topic,payload){
       if(this.handlers[topic]){
          for(var i=0;i<this.handlers[topic].length;i++){
            try{
              this.handlers[topic][i](topic,payload);
            }catch(e){
              console.log(e);
            }
          }
       }
    }
};
exports.wrap = wrap;
