
let testGET = {
	"version": "2.0",
	"routeKey": "$default",
	"rawPath": "/",
	"rawQueryString": "text=take%20one%20twice%20daily",
	"headers": {
		"x-amzn-tls-cipher-suite": "ECDHE-RSA-AES128-GCM-SHA256",
		"x-amzn-tls-version": "TLSv1.2",
		"x-amzn-trace-id": "Root=1-641f8a7a-7a50a2ea53dfb8fd692d3acf",
		"x-forwarded-proto": "https",
		"host": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"x-forwarded-port": "443",
		"x-forwarded-for": "81.102.154.20",
		"accept-encoding": "gzip, deflate",
		"user-agent": "vscode-restclient"
	},
	"queryStringParameters": {
		"text": "take one twice daily"
	},
	"requestContext": {
		"accountId": "anonymous",
		"apiId": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"domainName": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"domainPrefix": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"http": {
			"method": "GET",
			"path": "/",
			"protocol": "HTTP/1.1",
			"sourceIp": "81.102.154.20",
			"userAgent": "vscode-restclient"
		},
		"requestId": "060d5e58-3cac-411f-ad21-01b76bb81373",
		"routeKey": "$default",
		"stage": "$default",
		"time": "25/Mar/2023:23:57:46 +0000",
		"timeEpoch": 1679788666258
	},
	"isBase64Encoded": false
};

let testGET2 = {
	"version": "2.0",
	"routeKey": "$default",
	"rawPath": "/",
	"rawQueryString": "text=take%20one%20three%20times%20daily",
	"headers": {
		"x-amzn-tls-cipher-suite": "ECDHE-RSA-AES128-GCM-SHA256",
		"x-amzn-tls-version": "TLSv1.2",
		"x-amzn-trace-id": "Root=1-641f8a7a-7a50a2ea53dfb8fd692d3acf",
		"x-forwarded-proto": "https",
		"host": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"x-forwarded-port": "443",
		"x-forwarded-for": "81.102.154.20",
		"accept-encoding": "gzip, deflate",
		"user-agent": "vscode-restclient"
	},
	"queryStringParameters": {
		"text": "take one three times daily"
	},
	"requestContext": {
		"accountId": "anonymous",
		"apiId": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"domainName": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"domainPrefix": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"http": {
			"method": "GET",
			"path": "/",
			"protocol": "HTTP/1.1",
			"sourceIp": "81.102.154.20",
			"userAgent": "vscode-restclient"
		},
		"requestId": "060d5e58-3cac-411f-ad21-01b76bb81373",
		"routeKey": "$default",
		"stage": "$default",
		"time": "25/Mar/2023:23:57:46 +0000",
		"timeEpoch": 1679788666258
	},
	"isBase64Encoded": false
};

let testGETNoText = {
	"version": "2.0",
	"routeKey": "$default",
	"rawPath": "/",
	"rawQueryString": "not=here",
	"headers": {
		"x-amzn-tls-cipher-suite": "ECDHE-RSA-AES128-GCM-SHA256",
		"x-amzn-tls-version": "TLSv1.2",
		"x-amzn-trace-id": "Root=1-641f8a7a-7a50a2ea53dfb8fd692d3acf",
		"x-forwarded-proto": "https",
		"host": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"x-forwarded-port": "443",
		"x-forwarded-for": "81.102.154.20",
		"accept-encoding": "gzip, deflate",
		"user-agent": "vscode-restclient"
	},
	"queryStringParameters": {
		"not": "here"
	},
	"requestContext": {
		"accountId": "anonymous",
		"apiId": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"domainName": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"domainPrefix": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"http": {
			"method": "GET",
			"path": "/",
			"protocol": "HTTP/1.1",
			"sourceIp": "81.102.154.20",
			"userAgent": "vscode-restclient"
		},
		"requestId": "060d5e58-3cac-411f-ad21-01b76bb81373",
		"routeKey": "$default",
		"stage": "$default",
		"time": "25/Mar/2023:23:57:46 +0000",
		"timeEpoch": 1679788666258
	},
	"isBase64Encoded": false
};

let testPOST = {
	"version": "2.0",
	"routeKey": "$default",
	"rawPath": "/",
	"rawQueryString": "text=take%20one%20twice%20daily",
	"headers": {
		"content-length": "836",
		"x-amzn-tls-cipher-suite": "ECDHE-RSA-AES128-GCM-SHA256",
		"x-amzn-tls-version": "TLSv1.2",
		"x-amzn-trace-id": "Root=1-641f89bd-011468c012087be672103d00",
		"x-forwarded-proto": "https",
		"host": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"x-forwarded-port": "443",
		"content-type": "application/json",
		"x-forwarded-for": "81.102.154.20",
		"accept-encoding": "gzip, deflate",
		"user-agent": "vscode-restclient"
	},
	"queryStringParameters": {
		"text": "take one twice daily"
	},
	"requestContext": {
		"accountId": "anonymous",
		"apiId": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"domainName": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws",
		"domainPrefix": "ri5r6jkgohnqqsfmxlh2idvs3a0omdhs",
		"http": {
			"method": "POST",
			"path": "/",
			"protocol": "HTTP/1.1",
			"sourceIp": "81.102.154.20",
			"userAgent": "vscode-restclient"
		},
		"requestId": "d2518d6a-05fd-4a90-8e89-478824e8a75f",
		"routeKey": "$default",
		"stage": "$default",
		"time": "25/Mar/2023:23:54:37 +0000",
		"timeEpoch": 1679788477593
	},
	"body": "{\r\n    \"text\": \"take one twice daily\",\r\n    \"timing\": {\r\n        \"repeat\": {\r\n            \"frequency\": 2,\r\n            \"period\": 1,\r\n            \"periodUnit\": \"d\"\r\n        }\r\n    },\r\n    \"method\": {\r\n        \"coding\": [\r\n            {\r\n                \"system\": \"http://snomed.info/sct\",\r\n                \"code\": \"419652001\",\r\n                \"display\": \"Take\"\r\n            }\r\n        ]\r\n    },\r\n    \"doseAndRate\": [\r\n        {\r\n            \"type\": {\r\n                \"coding\": [\r\n                    {\r\n                        \"system\": \"http://terminology.hl7.org/CodeSystem/dose-rate-type\",\r\n                        \"code\": \"ordered\",\r\n                        \"display\": \"Ordered\"\r\n                    }\r\n                ]\r\n            },\r\n            \"doseQuantity\": {\r\n                \"value\": 1\r\n            }\r\n        }\r\n    ]\r\n}",
	"isBase64Encoded": false
};

let testStructure = {
	"text": "take one twice daily",
	"timing": {
		"repeat": {
			"frequency": 2,
			"period": 1,
			"periodUnit": "d"
		}
	},
	"method": {
		"coding": [
			{
				"system": "http://snomed.info/sct",
				"code": "419652001",
				"display": "Take"
			}
		]
	},
	"doseAndRate": [
		{
			"type": {
				"coding": [
					{
						"system": "http://terminology.hl7.org/CodeSystem/dose-rate-type",
						"code": "ordered",
						"display": "Ordered"
					}
				]
			},
			"doseQuantity": {
				"value": 1
			}
		}
	]
};

let testRecord = {
	"text": "One To Be Taken Each Day",
	"structure": {
		"text": "One To Be Taken Each Day",
		"doseAndRate": [
			{
				"doseQuantity": {
					"value": 1
				},
				"type": {
					"coding": [
						{
							"code": "ordered",
							"display": "Ordered",
							"system": "http://terminology.hl7.org/CodeSystem/dose-rate-type"
						}
					]
				}
			}
		],
		"method": {
			"coding": [
				{
					"code": "419652001",
					"display": "Take",
					"system": "http://snomed.info/sct"
				}
			]
		},
		"timing": {
			"repeat": {
				"frequency": 1,
				"period": 1,
				"periodUnit": "d"
			}
		}
	}
};

let testRegexed = {
	text: "take one three times daily",
	suggested: {
		text: "take one three times daily",
		timing: {
			repeat: {
				frequency: 3,
				period: 1,
				periodUnit: "d"
			}
		},
		method: {
			coding: [
				{
					system: "http://snomed.info/sct",
					code: "419652001",
					display: "Take"
				}
			]
		},
		doseQuantity: {
			value: 1
		}
	}
};

let testDelete = {
	rawPath: "/",
	rawQueryString: "text=take%20one%20twice%20daily",
	headers: {
		"accept-encoding": "gzip, deflate"
	},
	"queryStringParameters": {
		"text": "take one twice daily"
	},
	"requestContext": {
		"http": {
			"method": "DELETE",
			"path": "/",
			"protocol": "HTTP/1.1",
			"sourceIp": "20.0.213.50",
			"userAgent": "vscode-restclient"
		}
	},
	"isBase64Encoded": false
}
	;

module.exports = {
	testGET: testGET,
	testGET2: testGET2,
	testGETNoText: testGETNoText,
	testPOST: testPOST,
	testStructure: testStructure,
	testRecord: testRecord,
	testRegexed: testRegexed,
	testDelete: testDelete
};