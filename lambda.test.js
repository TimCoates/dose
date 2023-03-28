var utils = require("./lambda.js");
var AWSMock = require("aws-sdk-mock");
const eventData = require("./testEvents.js");
const testEvents = require("./testEvents.js");

describe("Testing Lambda", () => {

    describe("Testing handler", () => {

        it('GET Succeeds when record found', async () => {
            let event = testEvents.testGET;
            AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'get', 'mock called');
                callback(null, { Item: testEvents.testRecord });
            });

            let response = await utils.handler(event);
            console.log(response);
            expect(response.statusCode).toBe('200');
            expect(JSON.parse(response.body)).toStrictEqual(testEvents.testRecord.structure);
            AWSMock.restore('DynamoDB.DocumentClient');
        });

        it('GET Succeeds when record NOT found', async () => {
            let event = testEvents.testGET2;
            AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'get', 'mock called');
                callback(null, {});
            });

            let response = await utils.handler(event);
            console.log(response);
            expect(response.statusCode).toBe('200');
            expect(JSON.parse(response.body)).toStrictEqual(testEvents.testRegexed);
            expect(JSON.parse(response.body)).toHaveProperty("suggested");
            AWSMock.restore('DynamoDB.DocumentClient');
        });

        it('GET Sends 404 when no text provided on query string', async () => {
            let event = testEvents.testGETNoText;
            AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'get', 'mock called');
                callback(null, {});
            });

            let response = await utils.handler(event);
            console.log(response);
            expect(response.statusCode).toBe('404');
            AWSMock.restore('DynamoDB.DocumentClient');
        });

        it('POST Succeeds', async () => {
            let event = testEvents.testPOST;
            AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'put', 'mock called');
                callback(null, {});
            });

            let response = await utils.handler(event);
            console.log(response);
            expect(response.statusCode).toBe('200');
            expect(JSON.parse(response.body)).toStrictEqual({ "outcome": "saved" });
            AWSMock.restore('DynamoDB.DocumentClient');
        });

        it('DELETE Succeeds', async () => {
            let event = testEvents.testDelete;
            AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'delete', 'mock called');
                // delete just returns {}
                callback(null, {});
            });

            let response = await utils.handler(event);
            console.log(response);
            expect(response.statusCode).toBe('200');
            expect(JSON.parse(response.body)).toStrictEqual({ "outcome": "deleted" });
            AWSMock.restore('DynamoDB.DocumentClient');
        });

    });

    describe("Testing doRegex", () => {

        test("Easy one twice daily", (done) => {
            let testText = "take one twice daily";
            let res = utils.doRegex(testText);
            let expected = {
                doseQuantity: {
                    value: 1
                },
                method: {
                    coding: [
                        {
                            code: "419652001",
                            display: "Take",
                            system: "http://snomed.info/sct"
                        }
                    ]
                },
                text: "take one twice daily",
                timing: {
                    repeat: {
                        frequency: 2,
                        period: 1,
                        periodUnit: "d"
                    }
                }
            };
            expect(res).toEqual(expected);
            done();
        });

        test("Easy one daily", (done) => {
            let testText = "take one daily";
            let res = utils.doRegex(testText);
            let expected = {
                doseQuantity: {
                    value: 1
                },
                method: {
                    coding: [
                        {
                            code: "419652001",
                            display: "Take",
                            system: "http://snomed.info/sct"
                        }
                    ]
                },
                text: "take one daily",
                timing: {
                    repeat: {
                        frequency: 1,
                        period: 1,
                        periodUnit: "d"
                    }
                }
            };
            expect(res).toEqual(expected);
            done();
        });

        test("More complicated one daily", (done) => {
            let testText = "One tablet in the morning";
            let res = utils.doRegex(testText);
            console.log(JSON.stringify(res));
            let expected = {
                text: "One tablet in the morning",
                doseQuantity: {
                    unit: "tablet",
                    system: "http://snomed.info/sct",
                    code: "428673006",
                    value: 1
                },
                timing: {
                    repeat: {
                        when: ["MORN"]
                    }
                }
            };
            expect(res).toEqual(expected);
            done();
        });
    });

    describe("Testing handlePOST", () => {

        it("Works", async () => {
            AWSMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'put', 'mock called');
                callback(null, {});
            });

            let doseText = "take one daily";
            let structure = testEvents.testStructure;
            let result = await utils.handlePost(doseText, structure);

            AWSMock.restore('DynamoDB.DocumentClient');
            expect(result).toStrictEqual({});
        });
    });

    describe("Testing handleDelete", () => {

        it('Succeeds', async () => {

            AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'delete', 'mock called');
                callback(null, {});
            });

            const data = await utils.handleDelete(eventData.testGET);

            AWSMock.restore('DynamoDB.DocumentClient');
            expect(data).toStrictEqual({});
        });

    });

    describe("Testing handleGet", () => {

        it('Succeeds when record found', async () => {

            AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'get', 'mock called');
                callback(null, { Item: testEvents.testRecord });
            });

            const data = await utils.handleGet(eventData.testGET);

            AWSMock.restore('DynamoDB.DocumentClient');
            expect(data).toBe(testEvents.testRecord.structure);
        });

        it('Handles not found', async () => {

            AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
                console.log('DynamoDB.DocumentClient', 'get', 'mock called');
                callback(null, {});
            });

            const data = await utils.handleGet(eventData.testGET);

            expect(data).toBe(null);
            AWSMock.restore('DynamoDB.DocumentClient');
        });

    });

    describe("Testing pad", () => {

        it("Pads a single digit", () => {
            let input = "2";
            let expected = "02";
            let result = utils.pad(input);
            expect(result).toBe(expected);
        });
        it("Accepts two digits", () => {
            let input = "22";
            let expected = "22";
            let result = utils.pad(input);
            expect(result).toBe(expected);
        });
        it("Accepts no digits", () => {
            let input = "";
            let expected = "00";
            let result = utils.pad(input);
            expect(result).toBe(expected);
        });

    });

});


