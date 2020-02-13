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
          RequestId: {
            DataType: "String",
            StringValue: "Some auto generated requestId"
          }
        },
        MessageDeduplicationId: uuidv4(),
        MessageGroupId: uuidv4()
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
sqsStream.on("error", error => {
  console.error(error);
});
readStream.pipe(splitLines).pipe(sqsStream);
