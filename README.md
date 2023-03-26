# dose
Text to dose PoC

## Background
Structured dose adds immense value to meds data.
Where it is not captured at source, there's a question about the viability of adding it from the free text.

This repo tries a couple of things:
1) Because of reasons, there is an extremly high frequency of a small number of dose strings used. It therefore builds and holds a database of hand built structured representations of those doses. On receiving a text string it then simply looks it up and retrns a match if found.

2) Where that fails, it does some pattern matching in the string, to attempt to return a structured dose. This MUST be returned in a separate JSON structure to avoid it being considered as correct.

## Populating
In order to build the database for the first option, a structured dose can be `POST`ed to the service along with a text string.

Where the second approach has been used, the structured dose from the returned JSON can be `POST`ed in thereby making subsequent requests for that text string return a match.

Example calls:
```
GET https://ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws?text=take%20one%20twice%20daily

###

POST https://ri5r6jkgohnqqsfmxlh2idvs3a0omdhs.lambda-url.eu-west-2.on.aws?text=take%20one%20twice%20daily
Content-Type: application/json

{
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
}
```