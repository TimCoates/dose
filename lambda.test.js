var utils = require("./lambda.js");
var AWS = require("aws-sdk-mock");
const eventData = require("./testEvents.js");

describe("Testing Lambda", () => {

    describe("Testing doRegex", () => {
        test("Easy one", () => {
            let testText = "take one twice daily";
            let res = utils.doRegex(testText);
            let expected = {};
            expect(res).toBe(expected);
            done();
        });
    });

    describe("Testing doGet", () => {



        it('placeholder', async () => {
            //expect.assertions(1);
            //const data = await utils.handleGet();
            //expect(data).toBe('Mark');
            expect(true).toBe(true);
        });

    });

});


