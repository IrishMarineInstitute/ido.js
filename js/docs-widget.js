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
      var componentContainer = createElement("div",["col-xs-3"]);
      demoContainer.appendChild(demo);
      demoContainer.appendChild(componentContainer);
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
          var componentEls = fc.getElementsByClassName("component");
          var components = [];
          for(var i=0;i<componentEls.length;i++){
            componentEls[i].disabled = false;
            if(componentEls[i].checked){
              components.push(componentEls[i].getAttribute("name"));
            }
          }
          var componentsCode = "";
          if(components.length && components.length<componentEls.length){
            componentsCode = "\n     data-components='"+components.join(",")+"'";
            options.components = components;
          }
          code.innerHTML = "&lt;script src='ido.js'&gt;&lt;/script&gt;";
          code.innerText += "\n<div class='ido-widget'\n     data-widget='"+key+"'"+componentsCode+"></div>";
          service.widget("#"+demo.id,options);
        }.bind(this,prefix+'.'+location.key,service[location.key],demo,code,componentContainer);

        link.addEventListener("click", cb.bind(this,cb));
        li.appendChild(link);
        ul.appendChild(li);
      }
      div2.appendChild(ul);
      div.appendChild(div2);
      if(service.meta.components){
        var components = service.meta.components;
        for(var i=0;i<components.length;i++){
          var componentDiv = createElement('div',["checkbox"]);
          var label = createElement("label");
          var checkbox = createElement("input",["component"]);
          checkbox.setAttribute("type","checkbox");
          checkbox.setAttribute("name",components[i]);
          checkbox.checked = true;
          checkbox.disabled = true;
          checkbox.onchange = function(fc){
            fc.loader();
          }.bind(this,componentContainer);
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(components[i]));
          componentDiv.appendChild(label);
          componentContainer.appendChild(componentDiv);
        }
      }
      var div3 = createElement("div",["col-xs-7"]);
      div3.appendChild(codeContainer);
      div3.appendChild(demoContainer);
      div.appendChild(div3);
      return div;
    };
    var getProvider = function(provider,prefix,provider_href){
      var el = createElement("div");
      var link = createElement("a");
      link.setAttribute("name",provider_href);
      el.appendChild(link);
      var img = createElement("img","img-responsive");
      img.setAttribute("src",provider.meta.logo);
      el.setAttribute("alt",provider.meta.name);
      el.appendChild(img);
      el.appendChild(createElement("hr"))
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
    var getCustomWidgetDocs = function(){
      var examples = [
        {
          name: "Simple",
          description: ["A simple example of a custom widget which combines all the data for a specific location.",
           "This widget combines all the data for 'galwayport' location,"],
          code: "galwayport"
        },
        {
         name: "No titles",
         description: ["A small widget showing selected a single location, without titles.",
       "This widget shows the tides and tidesforecast for galwayport."],
         code: "galwayport[tides(height),tidesforecast(height)]"
       },

        {
         name: "Intermediate",
         description: ["A small widget showing selected data from two locations.",
       "This widget combines data from galwaybay and galwayport locations.",
       "From galwaybay location we include the ctd, with location and temperature components.",
       "From galwayport we include waves widget, with temperature component."],
         code: "galwaybay[ctd(location,temperature)],galwayport[waves(temperature)]"
       },
        {
         name: "Advanced",
         description: ["This advanced example shows multiple widgets from two locations combined."],
         code: "galwaybay[ctd(location,temperature),fluorometer(turbidity)],galwayport[waves(temperature,height),tides(height),tidesforecast(height)]"
       }
      ];
      var container = createElement("div",["container"]);
      var link = createElement("a");
      link.setAttribute("name","customwidget");
      container.appendChild(link);
      container.appendChild(createElement("h2",[],"Custom Widgets"));
      container.appendChild(createElement("p",[],"Custom widgets provide a way to combine selected data from one or more providers."
    + " This can be useful to create a consolidated view about a particular location."));
      var el = createElement("div",["row"]);
      container.appendChild(el);
      var colLeft = createElement("div",["col-xs-5"]);
      colLeft.appendChild(createElement("p",[],"Examples:"));
      var ul = createElement("ul");
      var colRight = createElement("div",["col-xs-7"]);
      el.appendChild(colLeft);
      el.appendChild(colRight);
      var codeContainer = createElement("div",["well"]);
      var code = createElement("code",[],
      "Select an example on the left to view the html and live widget");
      var live = createElement("div");
      colLeft.appendChild(ul);
      var docs = createElement("div");
      colLeft.appendChild(docs);
      codeContainer.appendChild(code);
      colRight.appendChild(codeContainer);
      colRight.appendChild(live);
      var cb = function(example,codebox,livebox,docs){
        var code = "<div class='ido-widget' data-widget='custom'\n";
        code += "  data-components='"+example.code+"'></div>";
        docs.innerHTML="";
        docs.appendChild(createElement("h3",[],example.name));
        for(var i=0;i<example.description.length;i++){
          docs.appendChild(createElement("p",[],example.description[i]));
        }
        codebox.innerText = code;
        livebox.innerHTML = code;
        ido.applyWidgets(livebox);
      }
      for(var i=0;i<examples.length;i++){
        var li = createElement("li");
        var a = createElement("a",[],examples[i].name);
        a.addEventListener("click", cb.bind(this,examples[i],code,live,docs));
        li.appendChild(a);
        ul.appendChild(li);
      }
      return container;
    }
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
      var custom = createElement('p');
      custom.appendChild(document.createTextNode("Data from different providers can be combined into "));
      var customlink = createElement('a',[],"custom widget");
      customlink.setAttribute('href','#customwidget');
      custom.appendChild(customlink);
      custom.appendChild(document.createTextNode("."));

      overview.appendChild(custom);
      container.appendChild(getCustomWidgetDocs());
      root.appendChild(container);
};
exports.documentation = documentation;
