const Exceliot = require("./exceliot");
var chai = require('chai');
var expect = chai.expect;

describe("exceliot model",function(){
    it("works on a happy day", function(){
    const exceliot = new Exceliot({async: false});
    const model = exceliot.register("test",{
      input: undefined,
      double: function(input){
        return 2*input;
      },
      quadruple: function(double){
        return 2*double;
      },
      twenty: function(bar_tenner){
        return 2*bar_tenner;
      }
    });
    const model2 = exceliot.register("bar",{
      tenner: function(test_double){
        return test_double*5;
      }
    });

    expect(model.hasOwnProperty('input')).equals(true);
    expect(model.hasOwnProperty('cheese')).equals(false);

    // all the values should be undefine so far.
    expect(model.input).equals(undefined);
    expect(model.double).equals(undefined);
    expect(model.twenty).equals(undefined);
    expect(model2.half).equals(undefined);
    // what happens when we set input
    model.input = 2;
    expect(model.input).equals(2);
    expect(model.double).equals(4);
    expect(model.twenty).equals(40);
    expect(model2.tenner).equals(model.input*10);

    // how about the container model with namespace
    expect(exceliot.test.input).equals(2);
    expect(exceliot.test_input).equals(2);
    expect(exceliot.bar.tenner).equals(20);
    expect(exceliot.bar_tenner).equals(20);

    // what happens when we set the container model
    exceliot.test_input = 3;
    expect(exceliot.bar_tenner).equals(30);
    exceliot.test.input = 5;
    expect(exceliot.bar.tenner).equals(50);

    // some properties are readonly
    expect(function(){model.double=3;}).to.throw(/Cannot assign value to readonly property/);
    expect(function(){exceliot.test.double=3;}).to.throw(/Cannot assign value to readonly property/);
    expect(function(){exceliot.test_double=3;}).to.throw(/Cannot assign value to readonly property/);
  });
  it("raises if bad namespace", function(){
    const exceliot = new Exceliot({async: false});
    expect(function(){
      exceliot.register("a_b",{foo: null});
    }).to.throw(/Illegal namespace/);
  });
  it("passes previous value", function(){
    const exceliot = new Exceliot({async: false});
    const model = exceliot.register("test",{
      a: null,
      count: function(_,a){
        return _ == undefined?1:_+1;
      },
      count2: function(_,a){
        return _ == undefined? {value: 1} : {value: _.value+1};
      },
      count3: function(_,a){
        return _ == undefined? { x: { value: 1} } : { x: { value: _.x.value+1}};
      }
    });
    model.a=500;
    model.a=1000;
    expect(model.count).equals(2);
    expect(model.count2.value).equals(2);
    expect(model.count3.x.value).equals(2);
  });
})
