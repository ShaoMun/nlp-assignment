import OpenAI from 'openai';
import { ChatMessage, getChatHistory } from './chatHistory';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatResponse(
  question: string,
  pdfContent: string,
  pdfId: string
): Promise<string> {
  try {
    const chatHistory = getChatHistory(pdfId);
    const recentMessages = chatHistory.slice(-5); // Get last 5 messages for context

    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on the provided PDF content. 
                 Your responses should be:
                 1. Accurate and based only on the PDF content
                 2. Contextual, considering the conversation history
                 3. Clear about when information isn't available in the PDF
                 4. Capable of referring to previous parts of the conversation
                 
                 PDF Content: ${pdfContent}`
      },
      // Add recent conversation history
      ...recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: question
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Updated to a more capable model
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get response from OpenAI');
  }
}
