var utils = require("./lambda.js");
var AWS = require("aws-sdk-mock");
const eventData = require("./testEvents.js");

describe("Testing GET", () => {

    test("Happy path", async (done) => {
        jest.setTimeout(5000);

        try {
            AWS.mock("DynamoDB", "getItem", async () => {
                var data = eventData.testStructure;
                return data;
            });

            let testText = "take one twice daily";
            let expected = eventData.testStructure;
            let res = await utils.handleGet(testText);
            AWS.restore("DynamoDB");
            expect(res).toBe(expected);
            done();
        } catch (ex) {
            console.error("Test broke");
        }
    });
});


