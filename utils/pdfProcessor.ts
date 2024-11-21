import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';

interface ParsedPDF {
  id: string;
  name: string;
  content: string;
  timestamp: number;
}

const DB_PATH = path.join(process.cwd(), 'data', 'pdfs.json');

export const processPDF = async (file: Buffer, fileName: string): Promise<ParsedPDF> => {
  try {
    // Parse PDF content
    const pdfData = await pdfParse(file);
    
    const pdfEntry = {
      id: uuidv4(),
      name: fileName,
      content: pdfData.text,
      timestamp: Date.now(),
    };

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Read existing data
    let existingData: ParsedPDF[] = [];
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      existingData = content ? JSON.parse(content) : [];
    }

    // Add new PDF and save
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
    
    // If file doesn't exist, create it with empty array
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
      return [];
    }

    const content = fs.readFileSync(DB_PATH, 'utf-8');
    
    // If file is empty or whitespace, initialize it
    if (!content.trim()) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
      return [];
    }

    // Try to parse the content
    const parsed = JSON.parse(content);
    
    // Verify that we got an array
    if (!Array.isArray(parsed)) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Error in parse function:', error);
    // Reset file to valid state
    fs.writeFileSync(DB_PATH, '[]', 'utf-8');
    return [];
  }
}
