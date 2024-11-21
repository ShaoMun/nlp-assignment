import { NextApiRequest, NextApiResponse } from 'next';
import { processPDF } from '@/utils/pdfProcessor';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const buffer = fs.readFileSync(file.filepath);
    const result = await processPDF(buffer, file.originalFilename || 'unnamed.pdf');

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing PDF' });
  }
}
