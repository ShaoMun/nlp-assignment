import { NextApiRequest, NextApiResponse } from 'next';
import { getChatHistory } from '@/utils/chatHistory';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { pdfId } = req.query;
    
    if (!pdfId || typeof pdfId !== 'string') {
      return res.status(400).json({ message: 'PDF ID is required' });
    }

    const history = getChatHistory(pdfId);
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
} 