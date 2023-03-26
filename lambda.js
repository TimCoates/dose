const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
	console.log('Received event:', JSON.stringify(event, null, 2));

	let body;
	let statusCode = '404';
	let result = {};
	let headers = {
		'Content-Type': 'application/json',
	};
	let params = {};

	try {
		switch (event.requestContext.http.method) {
			case 'DELETE':
				body = await dynamo.delete(JSON.parse(event.body)).promise();
				break;

			case 'GET':
				if ("queryStringParameters" in event) {
					if ("text" in event.queryStringParameters) {
						params = {
							TableName: 'tico3_doses',
							Key: {
								text: event.queryStringParameters.text
							}
						};
						result = await dynamo.get(params).promise();
						console.log(result);
						if ("Item" in result) {
							if ("structure" in result.Item) {
								let xmlHeaders = ["application/xml", "application/fhir+xml", "application/xml+fhir"];
								if (xmlHeaders.indexOf(event.headers.accept) != -1) {
									console.log("They want XML");

									// Iterate over the keys this object has
									for (const [key, value] of Object.entries(result.Item.structure)) {
										console.log(`${key}: ${value}`);
									}
								}
								body = result.Item.structure;
								statusCode = 200;
							}
						}
						else {
							body = `No structured dose matching: ${event.queryStringParameters.text}`;
							headers = {
								'Content-Type': 'text/plain'
							};
						}
					}
					else {
						body = "No query string parameter named text received";
						headers = {
							'Content-Type': 'text/plain'
						};
					}
				}
				else {
					body = "No query string parameter named text received";
					headers = {
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

				result = await dynamo.put(params).promise();
				statusCode = 200;
				break;

			default:
				throw new Error(`Unsupported method "${event.httpMethod}"`);
		}
	}
	catch (err) {
		statusCode = '400';
		body = err.message;
	}
	finally {
		body = JSON.stringify(body);
	}

	return {
		statusCode,
		body,
		headers,
	};
};
