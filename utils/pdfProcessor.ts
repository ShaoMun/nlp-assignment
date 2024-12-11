import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { preprocessText } from './nlpProcessor';

interface ParsedPDF {
  id: string;
  name: string;
  content: string;
  processedContent: string;
  timestamp: number;
}

const DB_PATH = path.join(process.cwd(), 'data', 'pdfs.json');

export const processPDF = async (file: Buffer, fileName: string): Promise<ParsedPDF> => {
  try {
    const pdfData = await pdfParse(file);
    
    const processedContent = preprocessText(pdfData.text);
    
    const pdfEntry = {
      id: uuidv4(),
      name: fileName,
      content: pdfData.text,
      processedContent: processedContent,
      timestamp: Date.now(),
    };

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let existingData: ParsedPDF[] = [];
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      existingData = content ? JSON.parse(content) : [];
    }

    existingData.push(pdfEntry);
    fs.writeFileSync(DB_PATH, JSON.stringify(existingData, null, 2));

    return pdfEntry;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
};

function ensureDirectoryExists() {
  const dir = './data';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function parse(): ParsedPDF[] {
  try {
    ensureDirectoryExists();
    
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
      return [];
    }

    const content = fs.readFileSync(DB_PATH, 'utf-8');
    
    if (!content.trim()) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
      return [];
    }

    const parsed = JSON.parse(content);
    
    if (!Array.isArray(parsed)) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Error in parse function:', error);
    fs.writeFileSync(DB_PATH, '[]', 'utf-8');
    return [];
  }
}

export async function getPdfContent(pdfId: string): Promise<string> {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'pdfs.json');
    if (!fs.existsSync(dbPath)) {
      throw new Error('PDF database not found');
    }
    
    const pdfs: ParsedPDF[] = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const pdf = pdfs.find(p => p.id === pdfId);
    
    if (!pdf) {
      throw new Error(`PDF with ID ${pdfId} not found`);
    }
    
    return pdf.content;
  } catch (error) {
    console.error('Error reading PDF:', error);
    throw new Error('Unable to read PDF content');
  }
}

export async function reprocessAllPdfs(): Promise<void> {
  try {
    const pdfs = parse();
    const reprocessedPdfs = pdfs.map(pdf => ({
      ...pdf,
      processedContent: preprocessText(pdf.content)
    }));

    fs.writeFileSync(DB_PATH, JSON.stringify(reprocessedPdfs, null, 2));
  } catch (error) {
    console.error('Error reprocessing PDFs:', error);
    throw error;
  }
}
