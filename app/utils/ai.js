import { GoogleGenAI } from "@google/genai";

/**
 * Initialize the Google Generative AI client
 * @returns {GoogleGenAI} The initialized AI client
 */
function initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new GoogleGenAI({ apiKey });
}

/**
 * Create a generative model configuration container
 * @param {Object} params - Configuration options
 * @param {string} params.modelName - The name of the model to use (default: "gemini-3.5-flash")
 * @param {Object} params.generationConfig - Configuration for the model generation
 * @param {string} params.systemInstruction - Optional system instructions
 * @param {string} params.thinking - Thinking level for the model (default: "medium")
 * @returns {Object} The model configuration container
 */
export function createModel({
    modelName = "gemini-3.5-flash",
    generationConfig = {},
    systemInstruction,
    thinking = "medium",
} = {}) {
    const ai = initializeAI();
    return {
        ai,
        modelName,
        generationConfig,
        systemInstruction,
        thinking,
    };
}

/**
 * Parse JSON response from AI, handling potential errors
 * @param {string} responseText - The text response from the AI
 * @returns {Object|null} The parsed JSON object or null if parsing fails
 */
export function parseAIResponse(responseText) {
    try {
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Error parsing AI response:", error);
        // Truncate response text to avoid logging potentially sensitive data
        const truncatedText =
            responseText?.length > 200
                ? `${responseText.substring(0, 200)}... (truncated, ${responseText.length} chars total)`
                : responseText;
        console.error("Response text (truncated):", truncatedText);
        return null;
    }
}

/**
 * Generate content using the AI model
 * @param {Object} model - The model configuration container
 * @param {string|Array} prompt - The prompt to send to the AI
 * @returns {Promise<string>} The generated text response
 */
export async function generateContent(model, prompt) {
    const { ai, modelName, generationConfig, systemInstruction, thinking } =
        model;

    const config = {
        ...generationConfig,
        systemInstruction,
    };

    if (thinking) {
        config.thinkingConfig = {
            thinkingLevel: thinking,
        };
    }

    const contents = Array.isArray(prompt) ? prompt : [prompt];

    const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
    });

    return response.text;
}

/**
 * Generate content using the AI model with streaming
 * @param {Object} model - The model configuration container
 * @param {string|Array} prompt - The prompt to send to the AI
 * @returns {Promise<AsyncGenerator<string>>} An async generator yielding text chunks
 */
export async function generateContentStream(model, prompt) {
    const { ai, modelName, generationConfig, systemInstruction, thinking } =
        model;

    const config = {
        ...generationConfig,
        systemInstruction,
    };

    if (thinking) {
        config.thinkingConfig = {
            thinkingLevel: thinking,
        };
    }

    const contents = Array.isArray(prompt) ? prompt : [prompt];

    const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config,
    });

    // Create a generator that yields text chunks as they arrive
    async function* streamIterator() {
        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                yield chunkText;
            }
        }
    }

    return streamIterator();
}
