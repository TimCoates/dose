var utils = require("./lambda.js");
var AWS = require("aws-sdk-mock");
const eventData = require("./testEvents.js");

describe("Testing Lambda", () => {

    describe("Testing doRegex", () => {

        test("Easy one twice daily", (done) => {
            let testText = "take one twice daily";
            let res = utils.doRegex(testText);
            let expected = {
                "doseQuantity": {
                    "value": 1,
                },
                "method": {
                    "coding": [
                        {
                            "code": "419652001",
                            "display": "Take",
                            "system": "http://snomed.info/sct",
                        },
                    ],
                },
                "text": "take one twice daily",
                "timing": {
                    "repeat": {
                        "frequency": 2,
                        "period": 1,
                        "periodUnit": "d",
                    },
                },
            };
            expect(res).toEqual(expected);
            done();
        });

        test("Easy one daily", (done) => {
            let testText = "take one daily";
            let res = utils.doRegex(testText);
            let expected = {
                "doseQuantity": {
                    "value": 1,
                },
                "method": {
                    "coding": [
                        {
                            "code": "419652001",
                            "display": "Take",
                            "system": "http://snomed.info/sct",
                        },
                    ],
                },
                "text": "take one daily",
                "timing": {
                    "repeat": {
                        "frequency": 1,
                        "period": 1,
                        "periodUnit": "d",
                    },
                },
            };
            expect(res).toEqual(expected);
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


