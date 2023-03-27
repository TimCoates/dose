const AWS = require('aws-sdk');

async function handler(event, context) {

	console.log('Received event:', JSON.stringify(event, null, 2));

	let params = {};
	let result = null;
	let httpResult = {
		body: {},
		statusCode: '404',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	try {

		if ("queryStringParameters" in event) {
			if ("text" in event.queryStringParameters) {

				switch (event.requestContext.http.method) {

					case 'DELETE':
						let delResult = handleDelete(event.queryStringParameters.text);
						result = { "outcome": "deleted" };
						httpResult.statusCode = "200";
						break;

					case 'GET':
						result = await handleGet(event.queryStringParameters.text);
						if (result == null) {
							let suggestion = doRegex(event.queryStringParameters.text);
							result = {
								"text": event.queryStringParameters.text,
								"suggested": suggestion
							};
						}
						httpResult.body = result;
						httpResult.statusCode = "200";
						break;

					case 'POST':
						let structure;
						if (event.isBase64Encoded) {
							structure = JSON.parse(Buffer.from(event.body, 'base64').toString('ascii'));
						} else {
							structure = JSON.parse(event.body);
						}
						let postResult = await handlePost(event.queryStringParameters.text, structure);
						httpResult.statusCode = "200";
						result = { "outcome": "saved" };
						break;

					default:
						throw new Error(`Unsupported method "${event.httpMethod}"`);
				}

			} else {
				httpResult.body = "No query string parameter named text received";
				httpResult.headers = { 'Content-Type': 'text/plain' };
			}
		} else {
			httpResult.body = "No query string parameter named text received";
			httpResult.headers = { 'Content-Type': 'text/plain' };
		}
	} catch (err) {
		httpResult.statusCode = '400';
		httpResult.body = err.message;
	}
	finally {
		httpResult.body = JSON.stringify(result);
	}

	return httpResult;
};

/** Handles deleting from the database
 * 
 * @param {*} doseText 
 */
async function handleDelete(doseText) {
	let docClient = new AWS.DynamoDB.DocumentClient();
	let params = {
		TableName: 'tico3_doses',
		Key: { text: doseText }
	};
	let delResult = await docClient.delete(params).promise();
	return {};
}

/** Function to do the get from database and return the found object or null
 * 
 * @param {*} doseText 
 */
async function handleGet(doseText) {
	let docClient = new AWS.DynamoDB.DocumentClient();
	let result = null;

	try {
		let params = {
			TableName: 'tico3_doses',
			Key: { text: doseText }
		};
		let getResult = await docClient.get(params).promise();
		console.log(getResult);
		if ("Item" in getResult) {
			if ("structure" in getResult.Item) {
				result = getResult.Item.structure;
			}
		}
	} catch (err) {
		console.log(JSON.stringify(err));
	}
	return result;
}

/** Function to do a put to the database. Returns nothing of interest.
 * 
 * @param {*} doseText 
 * @param {*} structure 
 */
async function handlePost(doseText, structure) {
	let docClient = new AWS.DynamoDB.DocumentClient();
	params = {
		TableName: 'tico3_doses',
		Item: {
			"text": doseText,
			"structure": structure
		}
	};
	let postResult = await docClient.put(params).promise();
	return postResult;
}

/** Function to try to build a structure based on the text strings that match
 * 
 * @param {*} dosetext 
 */
function doRegex(doseText) {
	let answer = {
		text: doseText,
		lower: doseText.toLowerCase()
	};

	try {

		// Handle the various Forms
		answer = DoForms(answer);

		answer = DoLatin(answer);

		answer = DoTimesPerDay(answer);

		answer = DoTimesPerWeek(answer);

		answer = DoHourlies(answer);

		answer = DoTimings(answer);

		answer = DoBoundsDurations(answer);

		answer = DoRoutes(answer);

		answer = DoMethods(answer);

		answer = DoQuantities(answer);

		answer = DoQuantitiesAgain(answer);

		answer = DoTimeConstraints(answer);

		answer = DoFoodTiming(answer);

		answer = DoRequired(answer);

		answer = DoDirected(answer);

		answer = DoTaken(answer);

		delete answer.lower;

	} catch (err) {
		console.log("Exception caught: " + err);
		console.log("=====================================================================================================");
		console.log(JSON.stringify(answer, null, 2));
		console.log("=====================================================================================================");
	}
	return answer;

}

module.exports = {
	handleGet: handleGet,
	handlePost: handlePost,
	handleDelete: handleDelete,
	doRegex: doRegex,
	pad: pad,
	handler: handler
};

/** Pads a number to 2 digits (e.g. converts '8' to '08')
 * 
 * @param {*} num 
 * @returns 
 */
function pad(num) {
	return ("00" + num).slice(-2);
}

/** Handles Tablets, Capsules, Drops, Puffs, Drops and Doses
 * 
 * @param {*} obj 
 * @returns 
 */
function DoForms(obj) {

	if (obj.lower.match(/\b(?:dose|doses|dose(s))\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:dose|doses|dose(s))\b/gm, "[[FORM]]");
		obj.doseQuantity = {
			unit: "dose",
			system: "http://snomed.info/sct",
			code: "3317411000001100"
		};
	}

	if (obj.lower.match(/\b(?:tablet|tablets|tablet(s))\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:tablet|tablets|tablet(s))\b/gm, "[[FORM]]");
		obj.doseQuantity = {
			unit: "tablet",
			system: "http://snomed.info/sct",
			code: "428673006"
		};
	}

	if (obj.lower.match(/\b(?:drop|drops|drop(s))\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:drop|drops|drop(s))\b/gm, "[[FORM]]");
		obj.doseQuantity = {
			unit: "Drop",
			system: "http://snomed.info/sct",
			code: "404218003"
		};
	}

	if (obj.lower.match(/\b(?:capsule|capsules|capsule(s))\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:capsule|capsules|capsule(s))\b/gm, "[[FORM]]");
		obj.doseQuantity = {
			unit: "capsule",
			system: "http://snomed.info/sct",
			code: "428641000"
		};
	}

	if (obj.lower.match(/\b(?:puff|puffs|puff(s))\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:puff|puffs|puff(s))\b/gm, "[[FORM]]");
		obj.doseQuantity = {
			unit: "dose",
			system: "http://snomed.info/sct",
			code: "3317411000001100"
		};
	}

	return obj;
}

/** Handles OD, BD, mane and nocte
 * 
 * @param {*} obj 
 * @returns 
 */
function DoLatin(obj) {
	{// First the daft latin OD
		if (obj.lower === "od") {
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
				}
			};
			obj.lower = "[[FREQUENCY]]";
		}

		if (obj.lower.match(/\b(?:1 od|1od|one od)\b/gmi)) {
			obj.doseQuantity = {
				value: 1
			};
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
				}
			};
			obj.lower = obj.lower.replace(/\b(?:1 od|1od|one od)\b/gmi, "[[FREQUENCY]]");
		}

		if (obj.lower.match(/\b(?:2 od|2od|two od)\b/gmi)) {
			obj.doseQuantity = {
				value: 2
			};
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
				}
			};
			obj.lower = obj.lower.replace(/\b(?:2 od|2od|two od)\b/gmi, "[[FREQUENCY]]");
		}
	}

	{// And BD
		if (obj.lower === "bd") {
			obj.timing = {
				repeat: {
					frequency: 2,
					period: 1,
					periodUnit: "d",
				}
			};
			obj.lower = "[[FREQUENCY]]";
		}

		if (obj.lower.match(/\b(?:1 bd|1bd|one bd)\b/gmi)) {
			obj.doseQuantity = {
				value: 1
			};
			obj.timing = {
				repeat: {
					frequency: 2,
					period: 1,
					periodUnit: "d",
				}
			};
			obj.lower = obj.lower.replace(/\b(?:1 bd|1bd|one bd)\b/gmi, "[[FREQUENCY]]");
		}

		if (obj.lower.match(/\b(?:2 bd|2bd|two bd)\b/gmi)) {
			obj.doseQuantity = {
				value: 2
			};
			obj.timing = {
				repeat: {
					frequency: 2,
					period: 1,
					periodUnit: "d",
				}
			};
			obj.lower = obj.lower.replace(/\b(?:2 bd|2bd|two bd)\b/gmi, "[[FREQUENCY]]");
		}
	}

	{// And nocte
		if (obj.lower === "nocte" || obj.lower === "noct") {
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
					when: ["NIGHT"]
				}
			};
			obj.lower = "[[FREQUENCY]]";
		}

		if (obj.lower.match(/\b(?:1 nocte|1nocte|one nocte|1 noct|1noct|one noct)\b/gmi)) {
			obj.doseQuantity = {
				value: 1
			};
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
					when: ["NIGHT"]
				}
			};
			obj.lower = obj.lower.replace(/\b(?:1 nocte|1nocte|one nocte|1 noct|1noct|one noct)\b/gmi, "[[FREQUENCY]]");
		}

		if (obj.lower.match(/\b(?:2 nocte|2nocte|two nocte|2 noct|2noct|two noct)\b/gmi)) {
			obj.doseQuantity = {
				value: 2
			};
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
					when: ["NIGHT"]
				}
			};
			obj.lower = obj.lower.replace(/\b(?:2 nocte|2nocte|two nocte|2 noct|2noct|two noct)\b/gmi, "[[FREQUENCY]]");
		}
	}

	{// And mane
		if (obj.lower === "mane") {
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
					when: ["MORN"]
				}
			};
			obj.lower = "[[FREQUENCY]]";
		}

		if (obj.lower.match(/\b(?:1 mane|1mane|one mane)\b/gmi)) {
			obj.doseQuantity = {
				value: 1
			};
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
					when: ["MORN"]
				}
			};
			obj.lower = obj.lower.replace(/\b(?:1 mane|1mane|one mane)\b/gmi, "[[FREQUENCY]]");
		}

		if (obj.lower.match(/\b(?:2 mane|2mane|two mane)\b/gmi)) {
			obj.doseQuantity = {
				value: 2
			};
			obj.timing = {
				repeat: {
					frequency: 1,
					period: 1,
					periodUnit: "d",
					when: ["MORN"]
				}
			};
			obj.lower = obj.lower.replace(/\b(?:2 mane|2mane|two mane)\b/gmi, "[[FREQUENCY]]");
		}
	}
	return obj;
}

/** Handle x times per day
 * 
 * @param {*} obj 
 * @returns 
 */
function DoTimesPerDay(obj) {
	// Eight times a day
	if (obj.lower.match(/\b(?:eight times daily|eight-times daily|eight times a day|eight-times a day|8 times\/day)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:eight times daily|eight-times daily|eight times a day|eight-times a day|8 times\/day)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 8,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	// Seven times a day
	if (obj.lower.match(/\b(?:seven times daily|seven-times daily|seven times a day|seven-times a day|7 times\/day)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:seven times daily|seven-times daily|seven times a day|seven-times a day|7 times\/day)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 7,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	// Six times a day
	if (obj.lower.match(/\b(?:six times daily|six-times daily|six times a day|six-times a day|6 times\/day)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:six times daily|six-times daily|six times a day|six-times a day|6 times\/day)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 6,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	// Five times a day
	if (obj.lower.match(/\b(?:five times daily|five-times daily|five times a day|five-times a day|5 times\/day)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:five times daily|five-times daily|five times a day|five-times a day|5 times\/day)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 5,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	// Four times a day
	if (obj.lower.match(/\b(?:four times daily|four-times daily|four times a day|four-times a day|4 times a day|4 times\/day)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:four times daily|four-times daily|four times a day|four-times a day|4 times a day|4 times\/day)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 4,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	// Three times a day
	if (obj.lower.match(/\b(?:thrice daily|three times daily|three-times daily|three times a day|three-times a day|3 times a day|3 times\/day)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:thrice daily|three times daily|three-times daily|three times a day|three-times a day|3 times a day|3 times\/day)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 3,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	// Twice a day
	if (obj.lower.match(/\b(?:twice a day|twice-a-day|twice daily|two times daily|2 times daily|two-times daily|two times a day|2 times\/day)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:twice a day|twice-a-day|twice daily|two times daily|2 times daily|two-times daily|two times a day|2 times\/day)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 2,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	// Once a day
	if (obj.lower.match(/\b(?:once a day|once daily|one time daily|one-time daily|daily|each day|each-day|every day|per day)\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:once a day|once daily|one time daily|one-time daily|daily|each day|each-day|every day|per day)\b/gm, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 1,
				periodUnit: "d",
			}
		};
	}

	return obj;
}

/** Handle x times per week
 * 
 * @param {*} obj 
 */
function DoTimesPerWeek(obj) {
	if (obj.lower.match(/\b(?:once a week|once weekly|one time weekly|one-time weekly|once-a-week)\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:once a week|once weekly|one time weekly|one-time weekly|once-a-week)\b/gm, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 1,
				periodUnit: "wk",
			}
		};
	}

	if (obj.lower.match(/\b(?:twice a week|twice weekly|two times weekly|two-times weekly|two time weekly|two-time weekly|twice-a-week)\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:twice a week|twice weekly|two times weekly|two-times weekly|two time weekly|two-time weekly|twice-a-week)\b/gm, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 2,
				period: 1,
				periodUnit: "wk",
			}
		};
	}

	if (obj.lower.match(/\b(?:thrice a week|thrice weekly|three times weekly|three-times weekly|three time weekly|three-time weekly|thrice-a-week|3 times a week|3 time a week|three times a week)\b/gm)) {
		obj.lower = obj.lower.replace(/\b(?:thrice a week|thrice weekly|three times weekly|three-times weekly|three time weekly|three-time weekly|thrice-a-week|3 times a week|3 time a week|three times a week)\b/gm, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 3,
				period: 1,
				periodUnit: "wk",
			}
		};
	}
	return obj;
}

/** Handle periods based on hours
 * 
 * @param {*} obj 
 * @returns 
 */
function DoHourlies(obj) {
	// 1
	if (obj.lower.match(/\b(?:every 1 hour|every 1 hours|every 1 hr|every 1 hrs|every one hour|every one hours|every one hr|every one hrs)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:every 1 hour|every 1 hours|every 1 hr|every 1 hrs|every one hour|every one hours|every one hr|every one hrs)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 1,
				periodUnit: "h",
			}
		};
	}

	// 2
	if (obj.lower.match(/\b(?:every 2 hour|every 2 hours|every 2 hr|every 2 hrs|every two hour|every two hours|every two hr|every two hrs)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:every 2 hour|every 2 hours|every 2 hr|every 2 hrs|every two hour|every two hours|every two hr|every two hrs)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 2,
				periodUnit: "h",
			}
		};
	}

	// 3
	if (obj.lower.match(/\b(?:every 3 hour|every 3 hours|every 3 hr|every 3 hrs|every three hour|every three hours|every three hr|every three hrs)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:every 3 hour|every 3 hours|every 3 hr|every 3 hrs|every three hour|every three hours|every three hr|every three hrs)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 3,
				periodUnit: "h",
			}
		};
	}

	// 4
	if (obj.lower.match(/\b(?:every 4 hour|every 4 hours|every 4 hr|every 4 hrs|every four hour|every four hours|every four hr|every four hrs)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:every 4 hour|every 4 hours|every 4 hr|every 4 hrs|every four hour|every four hours|every four hr|every four hrs)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 4,
				periodUnit: "h",
			}
		};
	}

	// 6
	if (obj.lower.match(/\b(?:every 6 hour|every 6 hours|every 6 hr|every 6hrs|every six hour|every six hours|every six hr|every six hrs)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:every 6 hour|every 6 hours|every 6 hr|every 6hrs|every six hour|every six hours|every six hr|every six hrs)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 6,
				periodUnit: "h",
			}
		};
	}



	// 8
	if (obj.lower.match(/\b(?:every 8 hour|every 8 hours|every 8 hr|every 8 hrs|every eight hour|every eight hours|every eight hr|every eight hrs)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:every 8 hour|every 8 hours|every 8 hr|every 8 hrs|every eight hour|every eight hours|every eight hr|every eight hrs)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 8,
				periodUnit: "h",
			}
		};
	}

	// 12
	if (obj.lower.match(/\b(?:every 12 hour|every 12 hours|every 12 hr|every 12 hrs|every twelve hour|every twelve hours|every twelve hr|every twelve hrs)\b/gmi)) {
		obj.lower = obj.lower.replace(/\b(?:every 12 hour|every 12 hours|every 12 hr|every 12 hrs|every twelve hour|every twelve hours|every twelve hr|every twelve hrs)\b/gmi, "[[FREQUENCY]]");
		obj.timing = {
			repeat: {
				frequency: 1,
				period: 12,
				periodUnit: "h",
			}
		};
	}
	return obj;
}

/** Do set time constraints
 * 
 * @param {*} obj 
 * @returns 
 */
function DoTimings(obj) {
	if (obj.lower.match(/[a][t]\s?\d{1,2}\s?[ap][m]/gmi)) {
		if (obj.lower.match(/[a][t]\s?\d{1,2}\s?[ap][m]/gmi).length == 1) {
			let time = obj.lower.match(/[a][t]\s?\d{1,2}\s?[ap][m]/gmi)[0];
			// Here we have a single phrase of "at xx a/pm"
			let hours = parseInt(time.replace(/[^0-9]/gmi, ""));
			let ampm = time.match(/[ap][m]/gmi)[0];
			if (ampm == "pm") {
				hours = hours + 12;
			}
			if (("timing" in obj) == false) {
				obj.timing = {};
			}
			if (("repeat" in obj.timing) == false) {
				obj.timing.repeat = {};
			}
			obj.timing.repeat.timeOfDay = pad(hours) + ":00:00";
			obj.lower = obj.lower.replace(/[a][t]\s?\d{1,2}\s?[ap][m]/gmi, "[[TIME OF DAY]]");
		}
	}

	// Timing..., match to regex:  /\d{1,2}\s?[ap]m/gmi  e.g. at 08:00 pm
	if (obj.lower.match(/[a][t]\s?\d{1,2}[:]\d{2}\s?[ap][m]/gmi)) {
		if (obj.lower.match(/[a][t]\s?\d{1,2}[:]\d{2}\s?[ap][m]/gmi).length == 1) {
			// Here we have a single phrase of "at xx:yy a/pm"
			let time = obj.lower.match(/[a][t]\s?\d{1,2}[:]\d{2}\s?[ap][m]/gmi)[0];
			let digits = time.match(/\d{1,2}[:]\d{2}/gmi)[0];
			let ampm = time.match(/[ap][m]/gmi)[0];
			let hours = parseInt(digits.split(":")[0]);
			if (ampm == "pm") {
				hours = hours + 12;
			}
			let mins = parseInt(digits.split(":")[1]);
			if (("timing" in obj) == false) {
				obj.timing = {};
			}
			if (("repeat" in obj.timing) == false) {
				obj.timing.repeat = {};
			}

			obj.timing.repeat.timeOfDay = pad(hours) + ":" + pad(mins) + ":00";
			obj.lower = obj.lower.replace(/[a][t]\s?\d{1,2}[:]\d{2}\s?[ap][m]/gmi, "[[TIME OF DAY]]");
		}
	}

	// Timing to match e.g. 22:00
	if (obj.lower.match(/[a][t]\s?\d{1,2}[:]\d{2}/gmi)) {
		if (obj.lower.match(/[a][t]\s?\d{1,2}[:]\d{2}/gmi).length == 1) {
			let time = obj.lower.match(/[a][t]\s?\d{1,2}[:]\d{2}/gmi)[0];
			let digits = time.match(/\d{1,2}[:]\d{2}/gmi)[0];
			let hours = parseInt(digits.split(":")[0]);
			let mins = parseInt(digits.split(":")[1]);
			if (("timing" in obj) == false) {
				obj.timing = {};
			}
			if (("repeat" in obj.timing) == false) {
				obj.timing.repeat = {};
			}

			obj.timing.repeat.timeOfDay = pad(hours) + ":" + pad(mins) + ":00";
			obj.lower = obj.lower.replace(/[a][t]\s?\d{1,2}[:]\d{2}/gmi, "[[TIME OF DAY]]");
		}
	}
	return obj;
}

/** Handle any bounds durations
 * 
 * @param {*} obj 
 * @returns 
 */
function DoBoundsDurations(obj) {
	{// Days
		// 1
		if (obj.lower.match(/(?:for one days)|(?:for 1 days)|(?:for one day)|(?:for 1 day)/gmi)) {
			if (obj.lower.match(/(?:for one days)|(?:for 1 days)|(?:for one day)|(?:for 1 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 1,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for one days)|(?:for 1 days)|(?:for one day)|(?:for 1 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}


		// 2
		if (obj.lower.match(/(?:for two days)|(?:for two day)|(?:for 2 days)|(?:for 2 day)/gmi)) {
			if (obj.lower.match(/(?:for two days)|(?:for two day)|(?:for 2 days)|(?:for 2 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 2,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for two days)|(?:for two day)|(?:for 2 days)|(?:for 2 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 3
		if (obj.lower.match(/(?:for three days)|(?:for three day)|(?:for 3 days)|(?:for 3 day)/gmi)) {
			if (obj.lower.match(/(?:for three days)|(?:for three day)|(?:for 3 days)|(?:for 3 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 3,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for three days)|(?:for three day)|(?:for 3 days)|(?:for 3 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 4
		if (obj.lower.match(/(?:for four days)|(?:for four day)|(?:for 4 days)|(?:for 4 day)/gmi)) {
			if (obj.lower.match(/(?:for four days)|(?:for four day)|(?:for 4 days)|(?:for 4 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 4,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for four days)|(?:for four day)|(?:for 4 days)|(?:for 4 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 5
		if (obj.lower.match(/(?:for five days)|(?:for five day)|(?:for 5 days)|(?:for 5 day)/gmi)) {
			if (obj.lower.match(/(?:for five days)|(?:for five day)|(?:for 5 days)|(?:for 5 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 5,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for five days)|(?:for five day)|(?:for 5 days)|(?:for 5 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 6
		if (obj.lower.match(/(?:for six days)|(?:for six day)|(?:for 6 days)|(?:for 6 day)/gmi)) {
			if (obj.lower.match(/(?:for six days)|(?:for six day)|(?:for 6 days)|(?:for 6 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 6,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for six days)|(?:for six day)|(?:for 6 days)|(?:for 6 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}


		// 7
		if (obj.lower.match(/(?:for seven days)|(?:for seven day)|(?:for 7 days)|(?:for 7 day)/gmi)) {
			if (obj.lower.match(/(?:for seven days)|(?:for seven day)|(?:for 7 days)|(?:for 7 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 7,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for seven days)|(?:for seven day)|(?:for 7 days)|(?:for 7 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 8
		if (obj.lower.match(/(?:for eight days)|(?:for eight day)|(?:for 8 days)|(?:for 8 day)/gmi)) {
			if (obj.lower.match(/(?:for eight days)|(?:for eight day)|(?:for 8 days)|(?:for 8 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 8,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for eight days)|(?:for eight day)|(?:for 8 days)|(?:for 8 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 9
		if (obj.lower.match(/(?:for nine days)|(?:for nine day)|(?:for 9 days)|(?:for 9 day)/gmi)) {
			if (obj.lower.match(/(?:for nine days)|(?:for nine day)|(?:for 9 days)|(?:for 9 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 9,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for nine days)|(?:for nine day)|(?:for 9 days)|(?:for 9 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}


		// 10
		if (obj.lower.match(/(?:for ten days)|(?:for ten day)|(?:for 10 days)|(?:for 10 day)/gmi)) {
			if (obj.lower.match(/(?:for ten days)|(?:for ten day)|(?:for 10 days)|(?:for 10 day)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 10,
					unit: "day",
					system: "http://unitsofmeasure.org",
					code: "d"
				};
				obj.lower = obj.lower.replace(/(?:for ten days)|(?:for ten day)|(?:for 10 days)|(?:for 10 day)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}
	}
	{// Now weeks
		// 1
		if (obj.lower.match(/(?:for one weeks)|(?:for one week)|(?:for 1 weeks)|(?:for 1 week)/gmi)) {
			if (obj.lower.match(/(?:for one weeks)|(?:for one week)|(?:for 1 weeks)|(?:for 1 week)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 1,
					unit: "week",
					system: "http://unitsofmeasure.org",
					code: "wk"
				};
				obj.lower = obj.lower.replace(/(?:for one weeks)|(?:for one week)|(?:for 1 weeks)|(?:for 1 week)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 2
		if (obj.lower.match(/(?:for two weeks)|(?:for two week)|(?:for 2 weeks)|(?:for 2 week)/gmi)) {
			if (obj.lower.match(/(?:for two weeks)|(?:for two week)|(?:for 2 weeks)|(?:for 2 week)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 2,
					unit: "week",
					system: "http://unitsofmeasure.org",
					code: "wk"
				};
				obj.lower = obj.lower.replace(/(?:for two weeks)|(?:for two week)|(?:for 2 weeks)|(?:for 2 week)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 3
		if (obj.lower.match(/(?:for three weeks)|(?:for three week)|(?:for 3 weeks)|(?:for 3 week)/gmi)) {
			if (obj.lower.match(/(?:for three weeks)|(?:for three week)|(?:for 3 weeks)|(?:for 3 week)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 3,
					unit: "week",
					system: "http://unitsofmeasure.org",
					code: "wk"
				};
				obj.lower = obj.lower.replace(/(?:for three weeks)|(?:for three week)|(?:for 3 weeks)|(?:for 3 week)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 4
		if (obj.lower.match(/(?:for four weeks)|(?:for four week)|(?:for 4 weeks)|(?:for 4 week)/gmi)) {
			if (obj.lower.match(/(?:for four weeks)|(?:for four week)|(?:for 4 weeks)|(?:for 4 week)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 4,
					unit: "week",
					system: "http://unitsofmeasure.org",
					code: "wk"
				};
				obj.lower = obj.lower.replace(/(?:for four weeks)|(?:for four week)|(?:for 4 weeks)|(?:for 4 week)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}


		// 5
		if (obj.lower.match(/(?:for five weeks)|(?:for five week)|(?:for 5 weeks)|(?:for 5 week)/gmi)) {
			if (obj.lower.match(/(?:for five weeks)|(?:for five week)|(?:for 5 weeks)|(?:for 5 week)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 5,
					unit: "week",
					system: "http://unitsofmeasure.org",
					code: "wk"
				};
				obj.lower = obj.lower.replace(/(?:for five weeks)|(?:for five week)|(?:for 5 weeks)|(?:for 5 week)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}
		// 6
		if (obj.lower.match(/(?:for six weeks)|(?:for six week)|(?:for 6 weeks)|(?:for 6 week)/gmi)) {
			if (obj.lower.match(/(?:for six weeks)|(?:for six week)|(?:for 6 weeks)|(?:for 6 week)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 6,
					unit: "week",
					system: "http://unitsofmeasure.org",
					code: "wk"
				};
				obj.lower = obj.lower.replace(/(?:for six weeks)|(?:for six week)|(?:for 6 weeks)|(?:for 6 week)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}
	}

	{// Months
		// 1 Months
		if (obj.lower.match(/(?:for one months)|(?:for one month)|(?:for 1 months)|(?:for 1 month)/gmi)) {
			if (obj.lower.match(/(?:for one months)|(?:for one month)|(?:for 1 months)|(?:for 1 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 1,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for one months)|(?:for one month)|(?:for 1 months)|(?:for 1 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 2 Months
		if (obj.lower.match(/(?:for two months)|(?:for two month)|(?:for 2 months)|(?:for 2 month)/gmi)) {
			if (obj.lower.match(/(?:for two months)|(?:for two month)|(?:for 2 months)|(?:for 2 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 2,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for two months)|(?:for two month)|(?:for 2 months)|(?:for 2 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 3 Months
		if (obj.lower.match(/(?:for three months)|(?:for three month)|(?:for 3 months)|(?:for 3 month)/gmi)) {
			if (obj.lower.match(/(?:for three months)|(?:for three month)|(?:for 3 months)|(?:for 3 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 3,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for three months)|(?:for three month)|(?:for 3 months)|(?:for 3 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 4 Months
		if (obj.lower.match(/(?:for four months)|(?:for four month)|(?:for 4 months)|(?:for 4 month)/gmi)) {
			if (obj.lower.match(/(?:for four months)|(?:for four month)|(?:for 4 months)|(?:for 4 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 4,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for four months)|(?:for four month)|(?:for 4 months)|(?:for 4 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 5 Months
		if (obj.lower.match(/(?:for five months)|(?:for five month)|(?:for 5 months)|(?:for 5 month)/gmi)) {
			if (obj.lower.match(/(?:for five months)|(?:for five month)|(?:for 5 months)|(?:for 5 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 5,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for five months)|(?:for five month)|(?:for 5 months)|(?:for 5 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 6 Months
		if (obj.lower.match(/(?:for six months)|(?:for six month)|(?:for 6 months)|(?:for 6 month)/gmi)) {
			if (obj.lower.match(/(?:for six months)|(?:for six month)|(?:for 6 months)|(?:for 6 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 6,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for six months)|(?:for six month)|(?:for 6 months)|(?:for 6 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 7 Months
		if (obj.lower.match(/(?:for seven months)|(?:for seven month)|(?:for 7 months)|(?:for 7 month)/gmi)) {
			if (obj.lower.match(/(?:for seven months)|(?:for seven month)|(?:for 7 months)|(?:for 7 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 7,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for seven months)|(?:for seven month)|(?:for 7 months)|(?:for 7 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 8 Months
		if (obj.lower.match(/(?:for eight months)|(?:for eight month)|(?:for 8 months)|(?:for 8 month)/gmi)) {
			if (obj.lower.match(/(?:for eight months)|(?:for eight month)|(?:for 8 months)|(?:for 8 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 8,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for eight months)|(?:for eight month)|(?:for 8 months)|(?:for 8 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 9 Months
		if (obj.lower.match(/(?:for nine months)|(?:for nine month)|(?:for 9 months)|(?:for 9 month)/gmi)) {
			if (obj.lower.match(/(?:for nine months)|(?:for nine month)|(?:for 9 months)|(?:for 9 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 9,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for nine months)|(?:for nine month)|(?:for 9 months)|(?:for 9 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 10 Months
		if (obj.lower.match(/(?:for ten months)|(?:for ten month)|(?:for 10 months)|(?:for 10 month)/gmi)) {
			if (obj.lower.match(/(?:for ten months)|(?:for ten month)|(?:for 10 months)|(?:for 10 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 10,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for ten months)|(?:for ten month)|(?:for 10 months)|(?:for 10 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 11 Months
		if (obj.lower.match(/(?:for eleven months)|(?:for eleven month)|(?:for 11 months)|(?:for 11 month)/gmi)) {
			if (obj.lower.match(/(?:for eleven months)|(?:for eleven month)|(?:for 11 months)|(?:for 11 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 11,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for eleven months)|(?:for eleven month)|(?:for 11 months)|(?:for 11 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}

		// 12 Months
		if (obj.lower.match(/(?:for twelve months)|(?:for twelve month)|(?:for 12 months)|(?:for 12 month)/gmi)) {
			if (obj.lower.match(/(?:for twelve months)|(?:for twelve month)|(?:for 12 months)|(?:for 12 month)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 12,
					unit: "month",
					system: "http://unitsofmeasure.org",
					code: "m"
				};
				obj.lower = obj.lower.replace(/(?:for twelve months)|(?:for twelve month)|(?:for 12 months)|(?:for 12 month)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}
	}

	{// Years
		// 1 Years
		if (obj.lower.match(/(?:for one years)|(?:for one year)|(?:for 1 years)|(?:for 1 year)/gmi)) {
			if (obj.lower.match(/(?:for one years)|(?:for one year)|(?:for 1 years)|(?:for 1 year)/gmi).length == 1) {
				if (("timing" in obj) == false) {
					obj.timing = { repeat: {} };
				}

				obj.timing.repeat.boundsDuration = {
					value: 1,
					unit: "year",
					system: "http://unitsofmeasure.org",
					code: "a"
				};
				obj.lower = obj.lower.replace(/(?:for one years)|(?:for one year)|(?:for 1 years)|(?:for 1 year)/gmi, "[[BOUNDS DURATION]]");
				obj.lower = obj.lower.replace(/(?:then stop)/gmi, "[[STOP]]");
			}
		}
	}
	return obj;
}

/** Handle different routes, oral, rectal, topical, subcutaneous, intramuscular, intravenous, inhalation
 * 
 * @param {*} obj 
 * @returns 
 */
function DoRoutes(obj) {
	if (obj.lower.match(/\b(?:oral)\b/gmi)) {
		obj.route = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "26643006",
					display: "oral"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:oral)\b/gmi, "[[ROUTE]]");
	}

	if (obj.lower.match(/\b(?:rectal)\b/gmi)) {
		obj.route = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "37161004",
					display: "Rectal"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:rectal)\b/gmi, "[[ROUTE]]");
	}

	if (obj.lower.match(/\b(?:topical)\b/gmi)) {
		obj.route = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "6064005",
					display: "Topical"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:topical)\b/gmi, "[[ROUTE]]");
	}

	if (obj.lower.match(/\b(?:subcutaneous route|subcutaneous)\b/gmi)) {
		obj.route = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "34206005",
					display: "Subcutaneous route"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:subcutaneous route|subcutaneous)\b/gmi, "[[ROUTE]]");
	}

	if (obj.lower.match(/\b(?:intramuscular route|intramuscularly|intramuscular)\b/gmi)) {
		obj.route = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "78421000",
					display: "Intramuscular route"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:intramuscular route|intramuscularly|intramuscular)\b/gmi, "[[ROUTE]]");
	}

	if (obj.lower.match(/\b(?:intravenous route|intravenous)\b/gmi)) {
		obj.route = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "47625008",
					display: "Intravenous route"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:intravenous route|intravenous)\b/gmi, "[[ROUTE]]");
	}

	if (obj.lower.match(/\b(?:to be inhaled|inhale)\b/gmi)) {
		obj.route = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "18679011000001101",
					display: "Inhalation"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:to be inhaled|inhale)\b/gmi, "[[ROUTE]]");
	}
	return obj;
}

/** Handle various methods; take, inject, insert, infusion, apply, apply sparingly
 * 
 * @param {*} obj 
 */
function DoMethods(obj) {
	if (obj.lower.match(/\b(?:inject)\b/gmi)) {
		obj.method = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "422145002",
					display: "Inject"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:inject)\b/gmi, "[[METHOD]]");
	}

	if (obj.lower.match(/\b(?:insert)\b/gmi)) {
		obj.method = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "421257003",
					display: "Insert"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:insert)\b/gmi, "[[METHOD]]");
	}

	if (obj.lower.match(/\b(?:infusion)\b/gmi)) {
		obj.method = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "129330003",
					display: "Infusion"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:infusion)\b/gmi, "[[METHOD]]");
	}

	if (obj.lower.match(/\b(?:apply sparingly)\b/gmi)) {
		obj.method = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "93431000001109",
					display: "Apply sparingly"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:apply sparingly)\b/gmi, "[[METHOD]]");
	}

	if (obj.lower.match(/\b(?:apply)\b/gmi)) {
		obj.method = {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "417924000",
					display: "Apply"
				}
			]
		}
		obj.lower = obj.lower.replace(/\b(?:apply)\b/gmi, "[[METHOD]]");
	}

	// Get the Take method before we remove Take
	if (obj.lower.match(/\b(?:take)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.method = {
				coding: [
					{
						system: "http://snomed.info/sct",
						code: "419652001",
						display: "Take"
					}
				]
			}
		}
	}
	return obj;
}

/** Handle the various quantity formats
 * 
 * @param {*} obj 
 * @returns 
 */
function DoQuantities(obj) {// Quantities
	{// Special 1 or 2 first
		if (obj.lower.match(/\b(?:take one or two)|(?:take 1 or 2)|(?:1 or 2 to be taken)|(?:one or two to be taken)\b/gmi)) {
			obj.doseAndRate = [
				{
					doseRange: {
						low: {
							value: 1
						},
						high: {
							value: 2
						}
					}
				}
			]
			obj.lower = obj.lower.replace(/\b(?:take one or two)|(?:take 1 or 2)|(?:1 or 2 to be taken)|(?:one or two to be taken)\b/gmi, "[[QUANTITY]]");
		}

		// Special 2 or 3
		if (obj.lower.match(/\b(?:take two or three)|(?:take 2 or 3)|(?:2 or 3 to be taken)|(?:two or three to be taken)\b/gmi)) {
			obj.doseAndRate = [
				{
					doseRange: {
						low: {
							value: 1
						},
						high: {
							value: 2
						}
					}
				}
			]
			obj.lower = obj.lower.replace(/\b(?:take two or three)|(?:take 2 or 3)|(?:2 or 3 to be taken)|(?:two or three to be taken)\b/gmi, "[[QUANTITY]]");
		}

		// Starts with 1 or one
		if (obj.lower.match(/^(?:one|1)\b/gm)) {
			if (("doseQuantity" in obj) == false) {
				obj.doseQuantity = { value: 1 };
			}
			obj.doseQuantity.value = 1;
			obj.lower = obj.lower.replace(/^(?:one|1)\b/gm, "[[QUANTITY]]");
		}

		// Starts with 2 or two
		if (obj.lower.match(/^(?:two|2)\b/gm)) {
			if (("doseQuantity" in obj) == false) {
				obj.doseQuantity = { value: 2 };
			}
			obj.doseQuantity.value = 2;
			obj.lower = obj.lower.replace(/^(?:two|2)\b/gm, "[[QUANTITY]]");
		}
	}


	if (obj.lower.match(/\b(?:take one)|(?:take 1)|(?:1 to be taken)|(?:one to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = { value: 1 };
		}
		obj.doseQuantity.value = 1;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take one)|(?:take 1)|(?:1 to be taken)|(?:one to be taken)\b/gmi, "[[METHOD]] [[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take two)|(?:take 2)|(?:2 to be taken)|(?:two to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 2;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take two)|(?:take 2)|(?:2 to be taken)|(?:two to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take three)|(?:take 3)|(?:three to be taken)|(?:3 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 3;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take three)|(?:take 3)|(?:three to be taken)|(?:3 to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take four)|(?:take 4)|(?:four to be taken)|(?:4 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 4;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take four)|(?:take 4)|(?:four to be taken)|(?:4 to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take five)|(?:take 5)|(?:five to be taken)|(?:5 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 5;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take five)|(?:take 5)|(?:five to be taken)|(?:5 to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take six)|(?:take 6)|(?:six to be taken)|(?:6 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 6;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take six)|(?:take 6)|(?:six to be taken)|(?:6 to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take seven)|(?:take 7)|(?:seven to be taken)|(?:7 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 7;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take seven)|(?:take 7)|(?:seven to be taken)|(?:7 to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take eight)|(?:take 8)|(?:eight to be taken)|(?:8 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 8;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take eight)|(?:take 8)|(?:eight to be taken)|(?:8 to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take nine)|(?:take 9)|(?:nine to be taken)|(?:9 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 9;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take nine)|(?:take 9)|(?:nine to be taken)|(?:9 to be taken)\b/gmi, "[[QUANTITY]]");
	}

	if (obj.lower.match(/\b(?:take ten)|(?:take 10)|(?:ten to be taken)|(?:10 to be taken)\b/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 10;
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take ten)|(?:take 10)|(?:ten to be taken)|(?:10 to be taken)\b/gmi, "[[QUANTITY]]");
	}
	return obj;
}

/** Handles quantities where they weren't picked up already
 * 
 * @param {*} obj 
 * @returns 
 */
function DoQuantitiesAgain(obj) {
	if (obj.lower.match(/\b(?:one)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 1;
		obj.lower = obj.lower.replace(/\b(?:one)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[1]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 1;
		obj.lower = obj.lower.replace(/\b[1]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:two)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 2;
		obj.lower = obj.lower.replace(/\b(?:two)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[2]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 2;
		obj.lower = obj.lower.replace(/\b[2]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:three)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 3;
		obj.lower = obj.lower.replace(/\b(?:three)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[3]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 3;
		obj.lower = obj.lower.replace(/\b[3]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:four)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 4;
		obj.lower = obj.lower.replace(/\b(?:four)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[4]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 4;
		obj.lower = obj.lower.replace(/\b[4]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:five)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 5;
		obj.lower = obj.lower.replace(/\b(?:five)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[5]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 5;
		obj.lower = obj.lower.replace(/\b[5]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:six)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 6;
		obj.lower = obj.lower.replace(/\b(?:six)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[6]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 6;
		obj.lower = obj.lower.replace(/\b[6]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:seven)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 7;
		obj.lower = obj.lower.replace(/\b(?:seven)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[7]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 7;
		obj.lower = obj.lower.replace(/\b[7]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}


	if (obj.lower.match(/\b(?:eight)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 8;
		obj.lower = obj.lower.replace(/\b(?:eight)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[8]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 8;
		obj.lower = obj.lower.replace(/\b[8]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:nine)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 9;
		obj.lower = obj.lower.replace(/\b(?:nine)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[9]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 9;
		obj.lower = obj.lower.replace(/\b[9]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b(?:ten)\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 10;
		obj.lower = obj.lower.replace(/\b(?:ten)\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}

	if (obj.lower.match(/\b[1][0]\s(?:\[\[FORM\]\])/gmi)) {
		if (("doseQuantity" in obj) == false) {
			obj.doseQuantity = {};
		}
		obj.doseQuantity.value = 10;
		obj.lower = obj.lower.replace(/\b[1][0]\s(?:\[\[FORM\]\])/gmi, "[[QUANTITY]] [[FORM]]");
	}
	return obj;
}

/** Handles specific time of day items
 * 
 * @param {*} obj 
 * @returns 
 */
function DoTimeConstraints(obj) {

	if (obj.lower.match(/\b(?:each morning\b)/gmi)) {
		if (("timing" in obj) == false) {
			obj.timing = {};
		}
		if (("repeat" in obj.timing) == false) {
			obj.timing.repeat = {};
		}
		if (("when" in obj.timing.repeat) == false) {
			obj.timing.repeat.when = [];
		}
		obj.timing.repeat = {
			frequency: 1,
			period: 1,
			periodUnit: "d",
			when: []
		};
		obj.timing.repeat.when.push("MORN");
		obj.lower = obj.lower.replace(/\b(?:each morning\b)/gmi, "[[FREQUENCY]] [[MORNING]]");
	}

	if (obj.lower.match(/\b(?:during the morning\b)|(?:in the morning\b)|(?:and morning\b)/gmi)) {
		if (("timing" in obj) == false) {
			obj.timing = {};
		}
		if (("repeat" in obj.timing) == false) {
			obj.timing.repeat = {};
		}
		if (("when" in obj.timing.repeat) == false) {
			obj.timing.repeat.when = [];
		}
		obj.timing.repeat.when.push("MORN");
		obj.lower = obj.lower.replace(/\b(?:during the morning\b)|(?:in the morning\b)|(?:and morning\b)/gmi, "[[MORNING]]");
	}

	// Night, again split each from the others
	if (obj.lower.match(/\b(?:each night\b)/gmi)) {
		if (("timing" in obj) == false) {
			obj.timing = {};
		}
		if (("repeat" in obj.timing) == false) {
			obj.timing.repeat = {};
		}
		if (("when" in obj.timing.repeat) == false) {
			obj.timing.repeat.when = [];
		}
		obj.timing.repeat = {
			frequency: 1,
			period: 1,
			periodUnit: "d",
			when: []
		};
		obj.timing.repeat.when.push("NIGHT");
		obj.lower = obj.lower.replace(/\b(?:each night\b)/gmi, "[[FREQUENCY]] [[NIGHT]]");
	}

	if (obj.lower.match(/\b(?:during the night)|(?:at night)|(?:in the night)|(?:and night)\b/gmi)) {
		if (("timing" in obj) == false) {
			obj.timing = {};
		}
		if (("repeat" in obj.timing) == false) {
			obj.timing.repeat = {};
		}
		if (("when" in obj.timing.repeat) == false) {
			obj.timing.repeat.when = [];
		}
		obj.timing.repeat.when.push("NIGHT");
		obj.lower = obj.lower.replace(/\b(?:during the night)|(?:at night)|(?:in the night)|(?:and night)\b/gmi, "[[NIGHT]]");
	}
	return obj;
}

/** Handles timings based around food
 * 
 * @param {*} obj 
 * @returns 
 */
function DoFoodTiming(obj) {
	if (obj.lower.match(/\b(?:food\b)/gmi)) {
		if (obj.lower.match(/\b(?:with\sor\safter\sfood\b)/gmi)) {
			if (("additionalInstruction" in obj) == false) {
				obj.additionalInstruction = [];
			}
			obj.additionalInstruction.push({ "text": "With or after food" });
			obj.lower = obj.lower.replace(/\b(?:with\sor\safter\sfood\b)/gmi, "[[ADDITIONAL]]");
		}

		if (obj.lower.match(/\b(?:before\sfood\b)/gmi)) {
			if (("additionalInstruction" in obj) == false) {
				obj.additionalInstruction = [];
			}
			obj.additionalInstruction.push({ "text": "Before food" });
			obj.lower = obj.lower.replace(/\b(?:before\sfood\b)/gmi, "[[ADDITIONAL]]");
		}

		if (obj.lower.match(/\b(?:with\sfood\b)/gmi)) {
			if (("additionalInstruction" in obj) == false) {
				obj.additionalInstruction = [];
			}
			obj.additionalInstruction.push({ "text": "With food" });
			obj.lower = obj.lower.replace(/\b(?:with\sfood\b)/gmi, "[[ADDITIONAL]]");
		}

	}
	return obj;
}

/** Handle as required attributes
 * 
 * @param {*} obj 
 * @returns 
 */
function DoRequired(obj) {

	if (obj.lower.match(/\b(?:when required|as required|as needed|when needed)\b/gmi)) {
		if (obj.lower.match(/\b(?:when required for wheezing|as required for wheezing|as needed for wheezing|when needed for wheezing)\b/gmi)) {
			obj.asNeededCodeableConcept = {
				"coding": [
					{
						"system": "http://snomed.info/sct",
						"code": "56018004",
						"display": "Wheezing"
					}
				]
			};

			obj.lower = obj.lower.replace(/\b(?:when required for wheezing|as required for wheezing|as needed for wheezing|when needed for wheezing)\b/gmi, "[[ASNEEDED]]");
		}

		if (obj.lower.match(/\b(?:when required for pain|as required for pain|as needed for pain|when needed for pain)\b/gmi)) {
			obj.asNeededCodeableConcept = {
				"coding": [
					{
						"system": "http://snomed.info/sct",
						"code": "22253000",
						"display": "Pain"
					}
				]
			};

			obj.lower = obj.lower.replace(/\b(?:when required for pain|as required for pain|as needed for pain|when needed for pain)\b/gmi, "[[ASNEEDED]]");
		}

		if (obj.lower.match(/\b(?:when required for nausea|as required for nausea|as needed for nausea|when needed for nausea)\b/gmi)) {
			obj.asNeededCodeableConcept = {
				"coding": [
					{
						"system": "http://snomed.info/sct",
						"code": "422587007",
						"display": "Nausea"
					}
				]
			};

			obj.lower = obj.lower.replace(/\b(?:when required for nausea|as required for nausea|as needed for nausea|when needed for nausea)\b/gmi, "[[ASNEEDED]]");
		}

		if (obj.lower.match(/\b(?:when required for diarrhea|as required for diarrhea|as needed for diarrhea|when needed for diarrhea)\b/gmi)) {
			obj.asNeededCodeableConcept = {
				"coding": [
					{
						"system": "http://snomed.info/sct",
						"code": "62315008",
						"display": "Diarrhea"
					}
				]
			};

			obj.lower = obj.lower.replace(/\b(?:when required for diarrhea|as required for diarrhea|as needed for diarrhea|when needed for diarrhea)\b/gmi, "[[ASNEEDED]]");
		}

		if (obj.lower.match(/\b(?:when required for dry skin|as required for dry skin|as needed for dry skin|when needed for dry skin)\b/gmi)) {
			obj.asNeededCodeableConcept = {
				"coding": [
					{
						"system": "http://snomed.info/sct",
						"code": "16386004",
						"display": "Dry skin"
					}
				]
			};

			obj.lower = obj.lower.replace(/\b(?:when required for dry skin|as required for dry skin|as needed for dry skin|when needed for dry skin)\b/gmi, "[[ASNEEDED]]");
		}
	}

	// As required / needed only
	if (obj.lower.match(/\b(?:when required|as required|as needed|when needed|prn)\b/gmi)) {
		obj.asNeededBoolean = true;
		obj.lower = obj.lower.replace(/\b(?:when required|as required|as needed|when needed|prn)\b/gmi, "[[ASNEEDED]]");
	}

	return obj;
}

/** Handles as directed Etc
 * 
 * @param {*} obj 
 * @returns 
 */
function DoDirected(obj) {
	// As directed / follow the directions etc
	if (obj.lower.match(/\b(?:as directed)|(?:follow the directions)\b/gmi)) {
		if (("additionalInstruction" in obj) == false) {
			obj.additionalInstruction = [];
		}
		obj.additionalInstruction.push({ "text": "As directed" });
		obj.lower = obj.lower.replace(/\b(?:as directed)|(?:follow the directions)\b/gmi, "[[ADDITIONAL]]");
	}
	return obj;
}

/** Handle any residual take or taken etc
 * 
 * @param {*} obj 
 * @returns 
 */
function DoTaken(obj) {

	if (obj.lower.match(/\b(?:take|taken)\b/gmi)) {
		let method = {
			system: "http://snomed.info/sct",
			code: "419652001",
			display: "Take"
		};
		if ("method" in obj) {
			if ("coding" in obj.method) {
				let found = false;
				for (coding of obj.method.coding) {
					if (coding.code === "419652001") {
						found = true;
					}
				}
				if (found == false) {
					obj.method.coding.push(method);
				}
			} else {
				obj.method.coding = [method];
			}
		} else {
			obj.method = {};
			obj.method.coding = [method];
		}
		obj.lower = obj.lower.replace(/\b(?:take|taken)\b/gmi, "[[METHOD]]");
	}
	return obj;
}
