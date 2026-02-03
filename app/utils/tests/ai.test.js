import { jest } from "@jest/globals";
import {
    createModel,
    parseAIResponse,
    generateContent,
    generateContentStream,
} from "../ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock the GoogleGenerativeAI library
jest.mock("@google/generative-ai");

describe("AI Utilities", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
    });

    describe("createModel", () => {
        it("should initialize GoogleGenerativeAI with API key and return model", () => {
            process.env.GEMINI_API_KEY = "test-api-key";
            const mockGetGenerativeModel = jest
                .fn()
                .mockReturnValue("mock-model");

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: mockGetGenerativeModel,
            }));

            const model = createModel();

            expect(GoogleGenerativeAI).toHaveBeenCalledWith("test-api-key");
            expect(mockGetGenerativeModel).toHaveBeenCalledWith({
                model: "gemini-3-flash-preview",
                generationConfig: {},
                systemInstruction: undefined,
            });
            expect(model).toBe("mock-model");
        });

        it("should accept custom configuration", () => {
            process.env.GEMINI_API_KEY = "test-api-key";
            const mockGetGenerativeModel = jest.fn();

            GoogleGenerativeAI.mockImplementation(() => ({
                getGenerativeModel: mockGetGenerativeModel,
            }));

            const config = {
                modelName: "custom-model",
                generationConfig: { temperature: 0.5 },
                systemInstruction: "test instruction",
            };

            createModel(config);

            expect(mockGetGenerativeModel).toHaveBeenCalledWith({
                model: "custom-model",
                generationConfig: { temperature: 0.5 },
                systemInstruction: "test instruction",
            });
        });

        it("should throw error if GEMINI_API_KEY is not set", () => {
            delete process.env.GEMINI_API_KEY;

            expect(() => createModel()).toThrow(
                "GEMINI_API_KEY environment variable is not set",
            );
        });
    });

    describe("parseAIResponse", () => {
        it("should parse valid JSON", () => {
            const jsonStr = '{"key": "value"}';
            const result = parseAIResponse(jsonStr);
            expect(result).toEqual({ key: "value" });
        });

        it("should return null and log error for invalid JSON", () => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const invalidJson = '{"key": "value"'; // Missing closing brace

            const result = parseAIResponse(invalidJson);

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it("should truncate long error logs securely", () => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const longInvalidJson = "x".repeat(300);

            parseAIResponse(longInvalidJson);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error parsing AI response:"),
                expect.any(Error),
            );

            // Check that the second mock call (parsing error details) contains truncated text
            // The function logs twice: one for error object, one for text
            const textLogCall = consoleSpy.mock.calls.find(
                (call) => call[0] === "Response text (truncated):",
            );
            expect(textLogCall).toBeDefined();
            expect(textLogCall[1]).toContain(
                "... (truncated, 300 chars total)",
            );

            consoleSpy.mockRestore();
        });
    });

    describe("generateContent", () => {
        it("should return text from the response", async () => {
            const mockText = jest.fn().mockReturnValue("generated text");
            const mockResponse = { text: mockText };
            const mockResult = { response: Promise.resolve(mockResponse) };
            const mockModel = {
                generateContent: jest.fn().mockResolvedValue(mockResult),
            };

            const result = await generateContent(mockModel, "test prompt");

            expect(mockModel.generateContent).toHaveBeenCalledWith(
                "test prompt",
            );
            expect(result).toBe("generated text");
        });
    });

    describe("generateContentStream", () => {
        it("should yield chunks from the stream", async () => {
            // Mock async iterable stream
            const mockStream = {
                async *[Symbol.asyncIterator]() {
                    yield { text: () => "chunk1" };
                    yield { text: () => "chunk2" };
                },
            };

            const mockResult = { stream: mockStream };
            const mockModel = {
                generateContentStream: jest.fn().mockResolvedValue(mockResult),
            };

            const streamIterator = await generateContentStream(
                mockModel,
                "test prompt",
            );

            expect(mockModel.generateContentStream).toHaveBeenCalledWith(
                "test prompt",
            );

            const chunks = [];
            for await (const chunk of streamIterator) {
                chunks.push(chunk);
            }

            expect(chunks).toEqual(["chunk1", "chunk2"]);
        });
    });
});
