import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from '@/utils/pdfProcessor';
import { getChatResponse } from '@/utils/openaiChat';
import { saveChatMessage } from '@/utils/chatHistory';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { question, pdfId } = req.body;
    
    if (!question || !pdfId) {
      return res.status(400).json({ 
        message: 'Question and PDF ID are required' 
      });
    }

    // Save user message
    const userMessage = {
      id: uuidv4(),
      pdfId,
      role: 'user' as const,
      content: question,
      timestamp: Date.now()
    };
    saveChatMessage(userMessage);

    // Get all PDFs from database
    const pdfs = parse();
    
    // Find the selected PDF
    const selectedPdf = pdfs.find(pdf => pdf.id === pdfId);
    
    if (!selectedPdf) {
      return res.status(404).json({ 
        message: 'PDF not found' 
      });
    }

    // Get response from OpenAI
    const response = await getChatResponse(question, selectedPdf.content, pdfId);

    // Save assistant message
    const assistantMessage = {
      id: uuidv4(),
      pdfId,
      role: 'assistant' as const,
      content: response,
      timestamp: Date.now()
    };
    saveChatMessage(assistantMessage);

    res.status(200).json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      message: 'Error processing chat request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
