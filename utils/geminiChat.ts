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
    
    // Filter to get only the most recent 5 messages and ensure they alternate user/model
    const recentMessages = chatHistory
      .slice(-5)
      .filter((msg, index) => 
        index === 0 ? msg.role === 'user' : msg.role !== chatHistory[index - 1].role
      );

    // Create chat with proper history formatting
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

    // Send user question with system prompt
    const result = await chat.sendMessage([
      { text: systemPrompt },
      { text: question }
    ]);
    
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error('Failed to get response from Gemini');
  }
} 