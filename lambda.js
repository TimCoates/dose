const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
	console.log('Received event:', JSON.stringify(event, null, 2));

	let params = {};
	let httpResult = {
		body: {},
		statusCode: '404',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	try {
		switch (event.requestContext.http.method) {
			case 'DELETE':
				params = {
					TableName: 'tico3_doses',
					Key: {
						text: event.queryStringParameters.text
					}
				};
				httpResult.body = await dynamo.delete(JSON.parse(event.body)).promise();
				break;

			case 'GET':
				if ("queryStringParameters" in event) {
					if ("text" in event.queryStringParameters) {
						httpResult = await handleGet(event.queryStringParameters.text);
					}
					else {
						httpResult.body = "No query string parameter named text received";
						httpResult.headers = {
							'Content-Type': 'text/plain'
						};
					}
				}
				else {
					httpResult.body = "No query string parameter named text received";
					httpResult.headers = {
						'Content-Type': 'text/plain'
					};
				}
				break;

			case 'POST':
				let buffer;
				if (event.isBase64Encoded) {
					buffer = Buffer.from(event.body, 'base64').toString('ascii');
				} else {
					buffer = event.body
				}
				params = {
					TableName: 'tico3_doses',
					Item: {
						"text": event.queryStringParameters.text,
						"structure": JSON.parse(buffer)
					}
				};

				let postResult = await dynamo.put(params).promise();
				httpResult.statusCode = 200;
				break;

			default:
				throw new Error(`Unsupported method "${event.httpMethod}"`);
		}
	}
	catch (err) {
		httpResult.statusCode = '400';
		httpResult.body = err.message;
	}
	finally {
		httpResult.body = JSON.stringify(httpResult.body);
	}

	return httpResult;
};


/** Function to do the GET and return the httpResult object
 * 
 * @param {*} dosetext 
 */
async function handleGet(dosetext) {
	let httpResult = {
		body: {},
		statusCode: '404',
		headers: { 'Content-Type': 'application/json' }
	};

	try {
		let params = {
			TableName: 'tico3_doses',
			Key: { text: dosetext }
		};
		let getResult = await dynamo.get(params).promise();
		console.log(getResult);
		if ("Item" in getResult) {
			if ("structure" in getResult.Item) {
				httpResult.body = getResult.Item.structure;
				httpResult.statusCode = 200;
			}
		}
		else {
			httpResult.body = `No structured dose matching: ${dosetext}`;
			httpResult.headers = {
				'Content-Type': 'text/plain'
			};
		}
	} catch (err) {
		httpResult.statusCode = '400';
		httpResult.body = err.message;
	}
	finally {
		httpResult.body = JSON.stringify(httpResult.body);
	}
	return httpResult;
}