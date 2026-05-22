import { jest } from "@jest/globals";
import {
    createModel,
    parseAIResponse,
    generateContent,
    generateContentStream,
} from "../ai";
import { GoogleGenAI } from "@google/genai";

// Mock the GoogleGenAI library
jest.mock("@google/genai");

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
        it("should initialize GoogleGenAI with API key and return model configuration container", () => {
            process.env.GEMINI_API_KEY = "test-api-key";

            const model = createModel();

            expect(GoogleGenAI).toHaveBeenCalledWith({
                apiKey: "test-api-key",
            });
            expect(model).toEqual({
                ai: expect.any(Object),
                modelName: "gemini-3.5-flash",
                generationConfig: {},
                systemInstruction: undefined,
                thinking: "medium",
            });
        });

        it("should accept custom configuration", () => {
            process.env.GEMINI_API_KEY = "test-api-key";

            const config = {
                modelName: "custom-model",
                generationConfig: { temperature: 0.5 },
                systemInstruction: "test instruction",
                thinking: "high",
            };

            const model = createModel(config);

            expect(GoogleGenAI).toHaveBeenCalledWith({
                apiKey: "test-api-key",
            });
            expect(model).toEqual({
                ai: expect.any(Object),
                modelName: "custom-model",
                generationConfig: { temperature: 0.5 },
                systemInstruction: "test instruction",
                thinking: "high",
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
            const mockGenerateContent = jest.fn().mockResolvedValue({
                text: "generated text",
            });
            const mockModel = {
                ai: {
                    models: {
                        generateContent: mockGenerateContent,
                    },
                },
                modelName: "gemini-3.5-flash",
                generationConfig: { temperature: 0.7 },
                systemInstruction: "system info",
                thinking: "medium",
            };

            const result = await generateContent(mockModel, "test prompt");

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-3.5-flash",
                contents: ["test prompt"],
                config: {
                    temperature: 0.7,
                    systemInstruction: "system info",
                    thinkingConfig: {
                        thinkingLevel: "medium",
                    },
                },
            });
            expect(result).toBe("generated text");
        });
    });

    describe("generateContentStream", () => {
        it("should yield chunks from the stream", async () => {
            // Mock async iterable stream
            const mockStream = {
                async *[Symbol.asyncIterator]() {
                    yield { text: "chunk1" };
                    yield { text: "chunk2" };
                },
            };

            const mockGenerateContentStream = jest
                .fn()
                .mockResolvedValue(mockStream);
            const mockModel = {
                ai: {
                    models: {
                        generateContentStream: mockGenerateContentStream,
                    },
                },
                modelName: "gemini-3.5-flash",
                generationConfig: { temperature: 0.7 },
                systemInstruction: "system info",
                thinking: "medium",
            };

            const streamIterator = await generateContentStream(
                mockModel,
                "test prompt",
            );

            expect(mockGenerateContentStream).toHaveBeenCalledWith({
                model: "gemini-3.5-flash",
                contents: ["test prompt"],
                config: {
                    temperature: 0.7,
                    systemInstruction: "system info",
                    thinkingConfig: {
                        thinkingLevel: "medium",
                    },
                },
            });

            const chunks = [];
            for await (const chunk of streamIterator) {
                chunks.push(chunk);
            }

            expect(chunks).toEqual(["chunk1", "chunk2"]);
        });
    });
});
