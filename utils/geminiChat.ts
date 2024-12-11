import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage, getChatHistory } from './chatHistory';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getGeminiResponse(
  question: string,
  pdfContent: string,
  pdfId: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const chatHistory = getChatHistory(pdfId);
    const recentMessages = chatHistory.slice(-5);

    const chat = model.startChat({
      history: recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const systemPrompt = `You are a helpful assistant that answers questions based on the provided PDF content. 
                         Your responses should be:
                         1. Accurate and based only on the PDF content
                         2. Contextual, considering the conversation history
                         3. Clear about when information isn't available in the PDF
                         4. Capable of referring to previous parts of the conversation
                         5. Sometimes you can have personal opinions but need to be very sure about it and also need to mention that it is your personal opinion.
                         
                         PDF Content: ${pdfContent}`;

    // Send system prompt first
    await chat.sendMessage(systemPrompt);
    
    // Send user question and get response
    const result = await chat.sendMessage(question);
    const response = result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get response from Gemini');
  }
} 