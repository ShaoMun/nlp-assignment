import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { compareTwoStrings } from 'string-similarity';

interface ChatMessage {
  id: string;
  pdfId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface PDF {
  id: string;
  name: string;
  content: string;
  timestamp: number;
}

interface EvaluationMetrics {
  contentAccuracy: number;
  relevance: number;
  completeness: number;
  overallScore: number;
  details: {
    keyFactsIdentified: string[];
    missingKeyFacts: string[];
    incorrectStatements: string[];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read chat history and PDFs
    const chatHistoryPath = path.join(process.cwd(), 'data', 'chat_history.json');
    const pdfsPath = path.join(process.cwd(), 'data', 'pdfs.json');
    
    const chatHistory = JSON.parse(fs.readFileSync(chatHistoryPath, 'utf8'));
    const pdfs = JSON.parse(fs.readFileSync(pdfsPath, 'utf8'));

    const evaluations: { [key: string]: EvaluationMetrics } = {};

    // Evaluate each conversation
    for (const [pdfId, messages] of Object.entries(chatHistory)) {
      const pdf = pdfs.find((p: PDF) => p.id === pdfId);
      if (!pdf) continue;

      const sourceContent = pdf.content;
      const conversations = messages as ChatMessage[];

      // Group Q&A pairs
      for (let i = 0; i < conversations.length - 1; i += 2) {
        const question = conversations[i];
        const answer = conversations[i + 1];
        
        if (!answer || question.role !== 'user' || answer.role !== 'assistant') continue;

        // Calculate metrics
        const metrics = evaluateResponse(sourceContent, question.content, answer.content);
        evaluations[answer.id] = metrics;
      }
    }

    return res.status(200).json({
      evaluations,
      summary: calculateAverageMetrics(evaluations)
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function evaluateResponse(
  sourceContent: string,
  question: string,
  answer: string
): EvaluationMetrics {
  // Extract key facts from source content
  const keyFacts = extractKeyFacts(sourceContent);
  
  // Check which facts are mentioned in the answer
  const identifiedFacts = keyFacts.filter(fact => 
    answer.toLowerCase().includes(fact.toLowerCase())
  );
  
  // Calculate content accuracy using string similarity
  const contentAccuracy = compareTwoStrings(sourceContent, answer);
  
  // Calculate relevance based on question-answer relationship
  const relevance = calculateRelevance(question, answer, sourceContent);
  
  // Calculate completeness based on identified facts
  const completeness = identifiedFacts.length / keyFacts.length;

  // Identify missing and incorrect information
  const missingKeyFacts = keyFacts.filter(fact => 
    !answer.toLowerCase().includes(fact.toLowerCase())
  );
  
  const incorrectStatements = findIncorrectStatements(answer, sourceContent);

  return {
    contentAccuracy,
    relevance,
    completeness,
    overallScore: (contentAccuracy + relevance + completeness) / 3,
    details: {
      keyFactsIdentified: identifiedFacts,
      missingKeyFacts,
      incorrectStatements
    }
  };
}

function extractKeyFacts(content: string): string[] {
  // Simple key fact extraction based on common resume sections
  const keyFactPatterns = [
    /Education/i,
    /Work.*Experience/i,
    /Skills/i,
    /Projects/i,
    /Achievements/i
  ];

  return keyFactPatterns
    .map(pattern => {
      const match = content.match(new RegExp(`${pattern.source}.*?(?=\\n\\n|$)`, 's'));
      return match ? match[0].trim() : null;
    })
    .filter((fact): fact is string => fact !== null);
}

function calculateRelevance(question: string, answer: string, source: string): number {
  // Calculate relevance based on keyword matching and context
  const questionKeywords = question.toLowerCase().split(' ');
  const relevantKeywords = questionKeywords.filter(keyword => 
    answer.toLowerCase().includes(keyword) && source.toLowerCase().includes(keyword)
  );
  
  return relevantKeywords.length / questionKeywords.length;
}

function findIncorrectStatements(answer: string, source: string): string[] {
  // Split answer into sentences
  const sentences = answer.match(/[^.!?]+[.!?]+/g) || [];
  
  return sentences.filter(sentence => {
    // Check if the sentence contains information that contradicts the source
    const sentenceContent = sentence.toLowerCase().trim();
    return !source.toLowerCase().includes(sentenceContent) &&
           sentenceContent.length > 20; // Filter out short sentences
  });
}

function calculateAverageMetrics(evaluations: { [key: string]: EvaluationMetrics }) {
  const metrics = Object.values(evaluations);
  if (metrics.length === 0) return null;

  return {
    averageAccuracy: metrics.reduce((sum, m) => sum + m.contentAccuracy, 0) / metrics.length,
    averageRelevance: metrics.reduce((sum, m) => sum + m.relevance, 0) / metrics.length,
    averageCompleteness: metrics.reduce((sum, m) => sum + m.completeness, 0) / metrics.length,
    averageOverallScore: metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length,
  };
} 