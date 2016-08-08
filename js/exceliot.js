'use strict';

function Exceliot(){
  this.data = {};
  this.listeners = {};
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

   add_listener: function(source,target,fn){
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
    registered: function(namespace){
      var that = this;
      return {
         on: function(key,cb){
            that.on(namespace+'_'+key,cb);
         },
         set: function(key,val,cb){
            that.set(namespace+'_'+key,val,cb);
         }
      }
    },
    register: function(namespace,obj){
      var keys = Object.keys(obj);
      for(var i=0;i<keys.length;i++){
       var key = keys[i];
       if(key.startsWith("__")){
          // it's private.
          continue;
       }
       if(typeof obj[key] == "function"){
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
      }
      return this.registered(namespace);
   },
    user_callback: function(fn,oldVal,newVal){
       return function(){fn(oldVal,newVal);};
    },
    notify: function(key,oldVal,newVal){
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
             setTimeout(cb,0);
         }
     },
     set: function(key,value,cb){
        //we will. eventually.
        setTimeout(this.__set.bind(this,key,value,cb),0);
     }
};

module.exports = Exceliot;
