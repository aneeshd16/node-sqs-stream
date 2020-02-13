# node-sqs-stream
Use Readable and Writable streams for AWS SQS

## installation

```bash
$ npm install node-sqs-stream --save
```
or
```bash
$ yarn add node-sqs-stream
```

## use
### Strings/Buffers
```js
//pipe contents of a file to SQS without blowing up your memory usage
const fs = require('fs');
const AWS = require('aws-sdk');
const { SQSWritableStream } = require('../index');
const { Transform } = require('stream');

const sqsClient = new AWS.SQS({apiVersion: '2012-11-05'});
const readStream = fs.createReadStream(__dirname + '/test');
const sqsStream = new SQSWritableStream({
    sqsClient: sqsClient,
    queueUrl: 'http://example-sqs-url',
});
const splitLines = new Transform({
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
        const lines = chunk.toString().split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            this.push(line);
        }
        callback();
    }
})
readStream.on('end', () => {
    console.log('Finished reading');
});
sqsStream.on('finish', () => {
    console.log('Finished writing');
})
readStream.pipe(splitLines).pipe(sqsStream);
```

### Full SQS Message
```js
const fs = require("fs");
const AWS = require("aws-sdk");
const { SQSWritableStream } = require("../index");
const { Transform } = require("stream");
const uuidv4 = require("uuid/v4");

const sqsClient = new AWS.SQS({ apiVersion: "2012-11-05" });
const readStream = fs.createReadStream(__dirname + "/test");
const sqsStream = new SQSWritableStream({
	sqsClient: sqsClient,
	queueUrl: "https://example-test"
});
const splitLines = new Transform({
	objectMode: true,
	transform(chunk, encoding, callback) {
		const lines = chunk.toString().split("\n");
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			this.push({
				Id: uuidv4(),
				MessageBody: line,
				DelaySeconds: 10,
				MessageAttributes: {
					"RequestId": {
						DataType: "String",
						StringValue: "Some auto generated requestId"
					}
				},
				MessageDeduplicationId: uuidv4(),
				MessageGroupId: uuidv4(),
				// MessageSystemAttributes: {
				// 	"AWSTraceHeader": {
				// 		DataType: "String",
				// 		StringValue: "xyz"
				// 	}
				// }
			});
		}
		callback();
	}
});
readStream.on("end", () => {
	console.log("Finished reading");
});
sqsStream.on("finish", () => {
	console.log("Finished writing");
});
sqsStream.on('error', (error) => {
    console.error(error)
})
readStream.pipe(splitLines).pipe(sqsStream);

```

The stream uses batching to reduce calls to SQS.

This is especially useful when doing [ETL](http://en.wikipedia.org/wiki/Extract,_transform,_load).

## license

The MIT License (MIT)

Copyright (c) 2013-2020 Brian M. Carlson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
