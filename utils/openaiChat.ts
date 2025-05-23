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
    const recentMessages = chatHistory.slice(-5); 

    const messages = [
      {
        role: "system" as const,
        content: `You are a helpful assistant that answers questions based on the provided PDF content. 
                 Your responses should be:
                 1. Accurate and based only on the PDF content
                 2. Contextual, considering the conversation history
                 3. Clear about when information isn't available in the PDF
                 4. Capable of referring to previous parts of the conversation
                 5. Sometimes you can have personal opinions but need to be very sure about it and also need to mention that it is your personal opinion.
                 
                 PDF Content: ${pdfContent}`
      },
      // Add recent conversation history
      ...recentMessages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: "user" as const,
        content: question
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
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
