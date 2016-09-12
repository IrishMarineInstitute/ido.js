'use strict';
var chai = require('chai');
var expect = chai.expect;
const Exceliot = require("../exceliot");
const metocean_widget = require("./cil-metocean-widget");


describe("metocean-model",function(){
  it("it works", function(){
    const exceliot = new Exceliot({async: false});
    var model = exceliot.register("cil",metocean_widget.model());
    model.row = {
      "hour": "2016-09-12T08:00:00Z",
      "WaterTemperature": 15.500,
      "WaveHeight": 0.900,
      "WavePeriod": 3,
      "GustSpeed": 26,
      "AverageWindSpeed": 19,
      "WindDirection": 158,
      "WindGustDirection": 120
    };
    expect(model.waterTemperature.waterTemperature, "water temperature").equals(15.5);
    expect(model.waveHeight.waveHeight, "wave height").equals(0.9);
    expect(model.wavePeriod.wavePeriod, "wave period").equals(3);
    expect(model.gustSpeed.gustSpeed, "gust speed").equals(26);
    expect(model.averageWindSpeed.averageWindSpeed, "average wind speed").equals(19);
    expect(model.windDirection.windDirection, "wind direction").equals(158);
    expect(model.windGustDirection.windGustDirection, "wind gust direction").equals(120);
    //expect(model.timestamp, "timestamp").equals(new Date("2016-09-12T08:00:00Z"));

  });
});
