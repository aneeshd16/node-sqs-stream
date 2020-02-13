const {SQSWritableStream} = require('../index');
const spec = require('stream-spec')

describe('SQSWritableStreamTests', () => {
    it('Initializes successfully and passes stream spec', () => {
        const sqsWritableStream = new SQSWritableStream({
            sqsClient: null,
            queueUrl: ''
        });
        spec(sqsWritableStream).writable().drainable().validateOnExit();
    })
})
