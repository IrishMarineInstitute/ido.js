'use strict';

var documentation = function(ido,root){
    var createElement = function(n,classes,text){
      var el = document.createElement(n);
      if(classes){
        for(var i=0;i<classes.length;i++){
          el.classList.add(classes[i]);
        }
     }
      if(text){
        el.innerText = text;
      }
      return el;
    };
    var getLocation = function(service,location){
      var container = createElement("div",[],location.name);
      return container;
    };
    var getService = function(service,prefix,provider_name,provider_href){
      var div = createElement("div",["row"]);
      div.appendChild(createElement("h3",[],service.meta.name));
      div.appendChild(createElement("p",[],service.meta.description));
      var div2 = createElement("div",["col-xs-5"]);
      var p = createElement("p");
      p.appendChild(document.createTextNode("Data from "));
      var a = createElement("a",[],provider_name);
      a.setAttribute("href",'#'+provider_href);
      p.appendChild(a);
      p.appendChild(document.createTextNode(" is available for:"));
      div2.appendChild(p);
      var ul = createElement("ul",[]);
      var demo = createElement("div",["col-xs-9"]);
      demo.id = "demo_"+prefix
      var codeContainer = createElement("div",["well"]);
      var code = createElement("code",[],
      "Select a location on the left to view the html and live widget");
      codeContainer.appendChild(code);
      var demoContainer = createElement("div",["row"]);
      var featureContainer = createElement("div",["col-xs-3"]);
      demoContainer.appendChild(demo);
      demoContainer.appendChild(featureContainer);
      for(var i=0;i<service.meta.locations.length;i++){
        var location = service.meta.locations[i];
        var li = createElement("li",[]);
        var li = createElement('li');
        var link = createElement('a');
        link.appendChild(getLocation(service,location));
        var cb = function(key,service,demo,code,fc,fn){
          if(fn){
            fc.loader = fn;
          }
          var options = {};
          var featureEls = fc.getElementsByClassName("feature");
          var features = [];
          for(var i=0;i<featureEls.length;i++){
            featureEls[i].disabled = false;
            if(featureEls[i].checked){
              features.push(featureEls[i].getAttribute("name"));
            }
          }
          var featuresCode = "";
          if(features.length && features.length<featureEls.length){
            featuresCode = " data-features='"+features.join(",")+"'";
            options.features = features;
          }
          code.innerHTML = "&lt;script src='ido.js'&gt;&lt;/script&gt;";
          code.innerText += "\n<div class='ido-widget' data-widget='"+key+"'"+featuresCode+"></div>";
          service.widget("#"+demo.id,options);
        }.bind(this,prefix+'.'+location.key,service[location.key],demo,code,featureContainer);

        link.addEventListener("click", cb.bind(this,cb));
        li.appendChild(link);
        ul.appendChild(li);
      }
      div2.appendChild(ul);
      div.appendChild(div2);
      if(service.meta.features){
        var features = service.meta.features;
        for(var i=0;i<features.length;i++){
          var featureDiv = createElement('div',["checkbox"]);
          var label = createElement("label");
          var checkbox = createElement("input",["feature"]);
          checkbox.setAttribute("type","checkbox");
          checkbox.setAttribute("name",features[i]);
          checkbox.checked = true;
          checkbox.disabled = true;
          checkbox.onchange = function(fc){
            fc.loader();
          }.bind(this,featureContainer);
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(features[i]));
          featureDiv.appendChild(label);
          featureContainer.appendChild(featureDiv);
        }
      }
      var div3 = createElement("div",["col-xs-7"]);
      div3.appendChild(codeContainer);
      div3.appendChild(demoContainer);
      div.appendChild(div3);
      return div;
    };
    var getProvider = function(provider,prefix,provider_href){
      var el = createElement("div",["container"]);
      var link = createElement("a");
      link.setAttribute("name",provider_href);
      el.appendChild(link);
      el.appendChild(createElement("h2",[],provider.meta.name));
      el.appendChild(createElement("p",[],provider.meta.description));
      var p = createElement("p");
      var a = createElement("a",[],"Irish Digital Ocean");
      a.setAttribute("href",'#ido_overview');
      p.appendChild(a);
      p.appendChild(document.createTextNode(" data services from "+provider.meta.name+":"));
      el.appendChild(p);
      var listOfservices = createElement('ul');
      el.appendChild(listOfservices);
      for(var i=0;i<provider.meta.types.length;i++){
        var key = provider.meta.types[i];
        var linkname = "a_"+prefix+"_"+key;
        var link = createElement("a",[],provider[key].meta.name);
        link.setAttribute("href",'#'+linkname);
        var li = createElement("li");
        li.appendChild(link);
        listOfservices.appendChild(li);
        var target = createElement("a");
        target.setAttribute("name",linkname);
        el.appendChild(target);
        el.appendChild(getService(provider[key],prefix+'.'+key,provider.meta.name,provider_href));
      }
      return el;
    };
      var container = createElement("div",["container"]);
      var overview = createElement("div",["page-header"]);
      var a = createElement("a");
      a.setAttribute("name","ido_overview");
      overview.appendChild(a);
      overview.appendChild(createElement('h1',[],ido.meta.name));
      overview.appendChild(createElement('p',[],ido.meta.description));
      overview.appendChild(createElement('p',[],"Services are provided by:"));
      var listOfProviders = createElement('ul');
      overview.appendChild(listOfProviders);
      container.appendChild(overview);
      for(var i=0;i<ido.meta.providers.length;i++){
        var key = ido.meta.providers[i];
        var provider = ido[key];
        var li = createElement('li');
        var link = createElement('a',[],provider.meta.name);
        var provider_href = 'ido_provider_'+key;
        link.setAttribute('href','#'+provider_href);
        li.appendChild(link);
        listOfProviders.appendChild(li);
        var el = document.createElement('div');
        el.appendChild(getProvider(provider,key,provider_href));
        container.appendChild(el);
      }
      root.appendChild(container);
};
exports.mi = require('./mi.js'),
exports.meta = {
  name: "Irish Digital Ocean API",
  description: "A collection of services for displaying live and \
  archived data about Ireland's Marine Environment",
  providers: ["mi"]
}
exports.documentation = documentation;
