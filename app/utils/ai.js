import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Initialize the Google Generative AI client
 * @returns {GoogleGenerativeAI} The initialized AI client
 */
function initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Create a generative model with the specified configuration
 * @param {string} modelName - The name of the model to use (default: "gemini-2.5-flash")
 * @param {Object} generationConfig - Configuration for the model generation
 * @returns {GenerativeModel} The initialized model
 */
export function createModel({
    modelName = "gemini-2.5-flash",
    generationConfig = {},
} = {}) {
    const genAI = initializeAI();
    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
    });
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
 * @param {GenerativeModel} model - The generative model to use
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} The generated text response
 */
export async function generateContent(model, prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return await response.text();
}
