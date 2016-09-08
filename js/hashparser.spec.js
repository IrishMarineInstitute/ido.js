const parser = require("./hashparser");
var chai = require('chai');
var expect = chai.expect;

describe("hashparser",function(){
  it("it works", function(){
    var result = parser.parse("tada");
    expect(result.length).equals(1);
    result = parser.parse("tada,woohoo");
    expect(result.length).equals(2);
    result = parser.parse("tada[cheese]");
    expect(result[0].widgets.length).equals(1);
    result = parser.parse("tada[cheese,wine]");
    expect(result[0].widgets.length).equals(2);
    expect(result[0].widgets[1].key).equals("wine");
    result = parser.parse("tada[cheese,wine(red)]");
    expect(result[0].widgets.length).equals(2);
    result = parser.parse("tada[cheese(white),wine]");
    expect(result[0].widgets.length).equals(2);
    expect(result[0].widgets[0].components.length).equals(1);
    result = parser.parse("tada[cheese(white,hard),wine]");
    expect(result[0].widgets[0].components.length).equals(2);
    expect(result[0].widgets[0].components[1]).equals("hard");
    result = parser.parse("tada[cheese(white,hard),wine],woohoo[party(food),people(fun,conversation)]");
    expect(result.length).equals(2);
    expect(result[1].widgets[1].components[1]).equals("conversation");

  });
});
