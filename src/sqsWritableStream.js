const { Writable } = require('stream');
const { generateId, SQSBatchSendError } = require('./utils');
/**
 *
 *
 * @class SQSWritableStream
 * @extends {Writable}
 */
class SQSWritableStream extends Writable {
	/**
	 *Creates an instance of SQSWritableStream.
	 * @param {Object} options.sqsClient instance of AWS.SQS
	 * @param {string} options.queueUrl URL of the SQS queue
	 * @param {Number} options.sqsBatchSize No of messages to be sent in one batch
	 * @memberof SQSWritableStream
	 */
	constructor(options) {
		super({ objectMode: true });
		this.sqsClient = options.sqsClient;
		this.queueUrl = options.queueUrl;
		this.sqsBatchSize = options.sqsBatchSize || 10;
		this.buffer = [];
	}

	async sendSQSBatchMessage(entries) {
		try {
			const result = await this.sqsClient
				.sendMessageBatch({
					Entries: entries,
					QueueUrl: this.queueUrl
				})
				.promise();
			if (result.Failed && result.Failed.length) {
				throw new SQSBatchSendError('SQS Batch Send Error', result.Failed);
			}
		} catch (error) {
			this.emit('failedEntries', entries);
			const failedIds = entries.map(e => e.Id);
			this.buffer = this.buffer.filter(entry => failedIds.indexOf(entry.Id) === -1);
			throw error;
		}
	}

	async _write(chunk, encoding, callback) {
		try {
			if (typeof chunk === 'string') {
				this.buffer.push({
					Id: generateId(),
					MessageBody: chunk
				});
			} else if (Buffer.isBuffer(chunk)) {
				this.buffer.push({
					Id: generateId(),
					MessageBody: chunk.toString()
				});
			} else {
				this.buffer.push(chunk);
			}
			if (this.buffer.length >= this.sqsBatchSize) {
				await this.sendSQSBatchMessage(this.buffer);
				this.buffer = [];
			}
			callback();
		} catch (error) {
			callback(error);
		}
	}

	async _final(callback) {
		try {
			if (this.buffer.length > 0) {
				await this.sendSQSBatchMessage(this.buffer);
				this.buffer = [];
			}
			return callback();
		} catch (error) {
			return callback(error);
		}
	}
}

module.exports = SQSWritableStream;
