jest.mock('uuid/v4', () => () => 'testid');
const { SQSWritableStream } = require('../index');
const { Readable } = require('stream');
const spec = require('stream-spec');

describe('SQSWritableStreamTests', () => {
	let mockSendMessageBatch = jest.fn(() => {
		console.log('here');
		return {
			promise: () => Promise.resolve({}),
		};
	});
	// mockSendMessageBatch.mockReturnValueOnce(() => {});
	let mockSqsClient = {
		sendMessageBatch: mockSendMessageBatch,
	};
	let mockReadStream = new Readable({ objectMode: true });
	mockReadStream._read = () => {};
	// uuidv4.mockImplementation(() => 'testid');

	it('Initializes successfully and passes stream spec', () => {
		const sqsWritableStream = new SQSWritableStream({
			sqsClient: mockSqsClient,
			queueUrl: '',
		});
		spec(sqsWritableStream)
			.writable()
			.drainable()
			.validateOnExit();
	});

	it('writes to the stream buffer', async () => {
		const sqsWritableStream = new SQSWritableStream({
			sqsClient: mockSqsClient,
			queueUrl: 'qu',
			sqsBatchSize: 10,
		});
		sqsWritableStream.write('test');
		expect(mockSendMessageBatch).not.toHaveBeenCalled();
		expect(sqsWritableStream.buffer).toHaveLength(1);
		expect(sqsWritableStream.buffer[0]).toEqual({
			Id: 'testid',
			MessageBody: 'test',
		});
	});

	it('calls sendMessageBatch when buffer is full', async () => {
		const sqsWritableStream = new SQSWritableStream({
			sqsClient: mockSqsClient,
			queueUrl: 'qu',
			sqsBatchSize: 1,
		});
		sqsWritableStream.write('test');
		expect(mockSendMessageBatch).toHaveBeenCalledWith({
			Entries: [{ Id: 'testid', MessageBody: 'test' }],
			QueueUrl: 'qu',
		});
	});
});
