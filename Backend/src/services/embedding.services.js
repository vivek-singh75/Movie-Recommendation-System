const { GoogleGenAI } = require("@google/genai");

async function embeddingServices(result) {

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: result,
    });

    return response.embeddings;
}

module.exports = embeddingServices;