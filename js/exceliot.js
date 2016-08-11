'use strict';

function Exceliot(options){
  options = options || {}
  this.async = options.async === false?false:true;
  this.data = {};
  this.listeners = {};
  this.ranges = {};
}
Exceliot.prototype = {
    argumentNames: function(fun) {
        var names = fun.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
            .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
            .replace(/\s+/g, '').split(',');
        return names.length == 1 && !names[0] ? [] : names;
    },
    functions: function(){
       return {
        __accumulate: function(_,value,n){
           if(_ == undefined || _ == null){
             _ = [];
           }
           _.push(value);
           while(_.length > n){
              _.shift();
           }
           return _;
        },
        __minute: function(){
           var time = new Date().getTime();
           return time - time % 60000;
        }
       }
    },

  dispatch: function(fn, args){
    try{
      fn = (typeof fn == "function") ? fn : window[fn];  // Allow fn to be a function object or the name of a global function
      return fn.apply(this.functions(), args || []);  // args is optional, use an empty array by default
    }catch(e){
       console.log(e);
       return undefined;
    }
  },
   __add_range_listener: function(source,target,fn){
     var extents = source.split("$");
     if(extents.length == 2){
       var ns = extents[0].split("_");
       extents[1] = ns+"_"+extents[1];
     }
     var range = this.ranges[key];
     if(range == undefined){
       range = {
         key: source,
          accepts: function(e0,e1,k){
             return k>=e0&&k<=e1;
           }.bind(null,extents[0],extents[1]),
           listeners: []
       };
       this.ranges[key] = range;
       this.listeners[key] = [];
     }
     this.listeners[key].push({"key": target, "fn": fn});
     var keys = Object.keys(this.listeners);
     for(var i=0;i<keys.length;i++){
       if(keys[i].indexOf('$')<0 && range.accepts(keys[i])){
         this.add_listener(keys[i],target,fn);
       }
     }

   },
   add_listener: function(source,target,fn){
       if(source.indexOf("$")>0){
         this.__add_range_listener(source,target,fn);
       }
       if(this.listeners[source] == undefined){
            this.listeners[source] = [];
        }
        this.listeners[source].push({"key": target, "fn": fn})
   },

    with_namespace: function(key,default_namespace){
      if(key.split('_').length<2){
         return default_namespace+'_'+key;
      }
      return key;
    },
    on: function(fq_key,callback){
       this.add_listener(fq_key,null,callback);
    },
    registered: function(namespace,properties){
      var that = this;
      var obj = {
         on: function(key,cb){
            that.on(namespace+'_'+key,cb);
         },
         set: function(key,val,cb){
            that.set(namespace+'_'+key,val,cb);
         }
      }
      for(var i=0;i<properties.length;i++){
        var property = properties[i];
        var key = property.key;
        var fqprop = namespace+'_'+key;
        var local_property = {
          set: function (key,x) { this.set(key,x); }.bind(that,fqprop),
          get: function (key,x) { return this.data[key]; }.bind(that,fqprop)
        };
        var ns_property = {
             set: function (key,x) { this.set(key,x); }.bind(that,fqprop),
             get: function (key,x) { return this.data[key]; }.bind(that,fqprop)
        };
        if(property.readonly){
          local_property.set = function(key,x){throw "Cannot assign value to readonly property "+key}.bind(null,key);
          ns_property.set = function (key,x){ throw "Cannot assign value to readonly property "+key}.bind(null,fqprop);
        }
        Object.defineProperty(obj, property.key, local_property);
        Object.defineProperty(that, fqprop, ns_property);
      }
      return obj;
    },
    register: function(namespace,obj){
      var keys = Object.keys(obj);
      var properties = [];
      for(var i=0;i<keys.length;i++){
       var key = keys[i];
       if(key.indexOf("__")==0){
          // it's private.
          continue;
       }
       var property = {key: key, readonly: false};
       if(typeof obj[key] == "function"){
         property.readonly = true;
         var fn = obj[key];
         fn.namespace = namespace;
         var args = this.argumentNames(fn);
         for(var j=0;j<args.length;j++){
            var param = args[j];
            if(param != "_"){
              this.add_listener(this.with_namespace(param,namespace),namespace+'_'+key,fn);
            }
          }
       }else{
          this.set(namespace+'_'+key,obj[key]);
        }
        properties.push(property);
      }
      var model = this.registered(namespace,properties);
      Object.defineProperty(this, namespace, {
        get: function () { return this; }.bind(model)
       });
       return model;

   },
    user_callback: function(fn,oldVal,newVal){
       return function(){fn(oldVal,newVal);};
    },
    notify: function(key,oldVal,newVal){
           var listeners = [];
           if(this.listeners[key] == undefined){
             return;
           }
           for(var i=0;i<this.listeners[key].length;i++){
             var listener = this.listeners[key][i];
             var isUserCallback = listener.key == null;
             if(isUserCallback){
                listener.fn(newVal,oldVal);
                continue;
             }
             var x = this.argumentNames(listener.fn);
             var params = [];
             for(var j=0;j<x.length;j++){
              var varName = x[j];
              if(varName == "_"){
                varName = listener.key;
              }
              var valueKey = this.with_namespace(varName,listener.fn.namespace);
              var value = this.data[valueKey];
              if(value !== undefined && value !== null){
                value = JSON.parse(JSON.stringify(value));
              }
              params.push(value);
             }
             this.set(listener.key,this.dispatch(listener.fn,params));
           }
       },
     __set: function(key,value,cb){
          var oldVal = this.data[key];
          if( oldVal !== value){
             this.data[key] = value;
             this.notify(key,oldVal,value);
          }
          if(cb){
            if(this.async){
              setTimeout(cb,0);
            }else{
              cb();
            }
         }
     },
     set: function(key,value,cb){
        //we will. eventually.
        var fn = this.__set.bind(this,key,value,cb);
        if(this.async){
          setTimeout(fn,0);
        }else{
          fn();
        }
     }
};

module.exports = Exceliot;
