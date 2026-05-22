// Mock for @google/genai to avoid ESM parsing issues in Jest tests
const GoogleGenAI = jest.fn().mockImplementation(() => {
    return {
        models: {
            generateContent: jest
                .fn()
                .mockResolvedValue({ text: "mocked response" }),
            generateContentStream: jest.fn().mockResolvedValue({
                async *[Symbol.asyncIterator]() {
                    yield { text: "mocked stream chunk" };
                },
            }),
        },
    };
});

module.exports = {
    GoogleGenAI,
};
