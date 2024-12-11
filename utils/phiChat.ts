import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { ChatMessage, getChatHistory } from './chatHistory';

const client = new ModelClient(
  "https://models.inference.ai.azure.com",
  new AzureKeyCredential(process.env.GITHUB_TOKEN || '')
) as any; 

export async function getPhiResponse(
  question: string,
  pdfContent: string,
  pdfId: string
): Promise<string> {
  try {
    const chatHistory = getChatHistory(pdfId);
    const recentMessages = chatHistory.slice(-5);

    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on the provided PDF content. 
                 Your responses should be:
                 1. Accurate and based only on the PDF content
                 2. Contextual, considering the conversation history
                 3. Clear about when information isn't available in the PDF
                 4. Capable of referring to previous parts of the conversation
                 5. Sometimes you can have personal opinions but need to be very sure about it and also need to mention that it is your personal opinion.
                 6. Dont show the disclaimer in the response.
                 PDF Content: ${pdfContent}`
      },
      ...recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: "user",
        content: question
      }
    ];

    const response = await client.path("/chat/completions").post({
      body: {
        messages,
        model: "Phi-3.5-MoE-instruct",
        temperature: 0.7,
        max_tokens: 1000
      }
    });

    if (response.status !== "200") {
      throw response.body.error;
    }

    return response.body.choices[0].message.content;
  } catch (error) {
    console.error('Phi API error:', error);
    throw new Error('Failed to get response from Phi');
  }
} 