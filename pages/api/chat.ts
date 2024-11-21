import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from '@/utils/pdfProcessor';
import { getChatResponse } from '@/utils/openaiChat';

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
    const response = await getChatResponse(question, selectedPdf.content);

    res.status(200).json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      message: 'Error processing chat request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
