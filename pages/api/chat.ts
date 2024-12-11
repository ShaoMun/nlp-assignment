import type { NextApiRequest, NextApiResponse } from 'next';
import { getPdfContent } from '@/utils/pdfProcessor';
import { getChatResponse } from '@/utils/openaiChat';
import { getGeminiResponse } from '@/utils/geminiChat';
import { getLlamaResponse } from '@/utils/llamaChat';
import { getPhiResponse } from '@/utils/phiChat';
import { addChatMessage } from '@/utils/chatHistory';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { question, pdfId, model } = req.body;

    if (!question || !pdfId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let pdfContent: string;
    try {
      pdfContent = await getPdfContent(pdfId);
    } catch (error) {
      console.error('PDF error:', error);
      return res.status(404).json({ message: 'PDF not found or cannot be read' });
    }

    let response: string;
    try {
      switch (model) {
        case 'gpt4o':
          response = await getChatResponse(question, pdfContent, pdfId);
          break;
        case 'gemini':
          response = await getGeminiResponse(question, pdfContent, pdfId);
          break;
        case 'llama':
          response = await getLlamaResponse(question, pdfContent, pdfId);
          break;
        case 'phi':
          response = await getPhiResponse(question, pdfContent, pdfId);
          break;
        default:
          return res.status(400).json({ message: 'Invalid model selection' });
      }
    } catch (error) {
      console.error('Model error:', error);
      return res.status(500).json({ 
        message: 'Error generating response', 
        error: String(error),
        model: model
      });
    }

    // Save the conversation to history
    try {
      addChatMessage(pdfId, { role: 'user', content: question });
      addChatMessage(pdfId, { role: 'assistant', content: response });
    } catch (error) {
      console.error('History error:', error);
      // Don't fail the request if history saving fails
    }

    res.status(200).json({ response });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}
