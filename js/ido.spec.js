GLOBAL.ido = require("./main").ido;
var chai = require('chai');
var expect = chai.expect;


describe("str2widgetHTML",function(){
  it("it works", function(){
    var html = ido.str2widgetHTML("galwayport");
    expect(html.length>0,"there should be some html for galwayport").equals(true);
    var html = ido.str2widgetHTML("galwayport[tides]");
    expect(html).equals("<div class='ido-widget' data-widget='mi.tides.galwayport'></div>");
    html = ido.str2widgetHTML("galwayport[tides(height)]");
    expect(html).equals("<div class='ido-widget' data-widget='mi.tides.galwayport' data-components='height'></div>");
    html = ido.str2widgetHTML("galwayport[tides(height,latest)],dublinport[tides(height)]");
    expect(html).equals("<div class='ido-widget' data-widget='mi.tides.galwayport' data-components='height,latest'></div><div class='ido-widget' data-widget='mi.tides.dublinport' data-components='height'></div>");
  });
});
