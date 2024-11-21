import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const dataFilePath = path.join(process.cwd(), 'data', 'pdfs.json');
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    const pdfs = JSON.parse(fileContents);
    
    res.status(200).json(pdfs);
  } catch (error) {
    console.error('Error reading PDFs:', error);
    res.status(500).json({ message: 'Error reading PDFs' });
  }
} 