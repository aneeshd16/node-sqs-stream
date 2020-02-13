const uuidv4 = require("uuid/v4");

const generateId = uuidv4;

class SQSBatchSendError extends Error {
	constructor(message, details) {
		super(message);
		this.name = this.constructor.name;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = {
	generateId,
	SQSBatchSendError
};
