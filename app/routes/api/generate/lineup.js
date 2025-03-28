import { GoogleGenerativeAI } from "@google/generative-ai";

import schema from './utils/lineupSchema';
import prompt from './utils/lineupPrompt';

export async function action({ request }) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Initalise a generative model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        // Retrieve the data we recieve as part of the request body
        const players = await request.json();

        const updatedPrompt = `
            Generate a softball batting order and fielding chart for the following players, adhering to the specified rules:

            ${JSON.stringify(players)}
            
            ${prompt}`;

        // Pass the prompt to the model and retrieve the output
        const result = await model.generateContent(updatedPrompt);
        const response = await result.response;
        const output = await response.text();

        if (output) {
            // Send the llm output as a server reponse object
            return new Response(JSON.stringify({ generatedChart: JSON.parse(output) }), {
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.error('Error generating lineup: ', error)
    }
}