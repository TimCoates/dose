var utils = require("./lambda.js");
var AWS = require("aws-sdk-mock");
const eventData = require("./testEvents.js");

describe("Testing Lambda", () => {

    test("Easy one", () => {
        let testText = "take one twice daily";
        let res = utils.doRegex(testText);
        let expected = {};
        expect(res).toBe(expected);
        done();
    });
});


