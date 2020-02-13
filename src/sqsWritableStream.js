const { Writable } = require('stream');
const { generateId } = require('./utils');
/**
 *
 *
 * @class SQSWritableStream
 * @extends {Writable}
 */
class SQSWritableStream extends Writable {

    /**
     *Creates an instance of SQSWritableStream.
     * @param {Object} options Config Options
     * @param {Object} options.sqsClient
     * @param {string} options.queueUrl
     * @param {Number} options.sqsBatchSize
     * @memberof SQSWritableStream
     */
    constructor(options) {
        super({ objectMode: true });
        this.sqsClient = options.sqsClient;
        this.queueUrl = options.queueUrl;
        this.sqsBatchSize = options.sqsBatchSize || 10;
        this.buffer = [];
    }

    async _write(chunk, encoding, callback) {
        try {
            if (typeof chunk === 'string') {
                this.buffer.push({
                    Id: generateId(),
                    MessageBody: chunk
                })
            } else {
                this.buffer.push(chunk);
            }
            if (this.buffer.length >= this.sqsBatchSize) {
                await this.sqsClient.sendMessageBatch({
                    Entries: this.buffer,
                    QueueUrl: this.queueUrl
                }).promise();
                this.buffer = [];
            }
            return callback();
        } catch (error) {
            return callback(error);
        }
    }

    async _final(callback) {
        try {
            if (this.buffer.length > 0) {
                await this.sqsClient.sendMessageBatch({
                    Entries: this.buffer,
                    QueueUrl: this.queueUrl
                }).promise();
                this.buffer = [];
            }
            return callback();
        } catch (error) {
            return callback(error);
        }  
    }
}

module.exports = SQSWritableStream;