const fs = require("fs");
const AWS = require("aws-sdk");
const { SQSWritableStream } = require("../index");
const { Transform } = require("stream");

const sqsClient = new AWS.SQS({ apiVersion: "2012-11-05" });
const readStream = fs.createReadStream(__dirname + "/test");
const sqsStream = new SQSWritableStream({
  sqsClient: sqsClient,
  queueUrl: "http://example-sqs-url"
});
const splitLines = new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    const lines = chunk.toString().split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      this.push(line);
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
readStream.pipe(splitLines).pipe(sqsStream);
