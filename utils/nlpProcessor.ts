import natural from 'natural';
import stopwords from 'stopwords';
import { tokenize } from 'tokenize-text';
import lemmatizer from 'lemmatizer';

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

export function preprocessText(text: string): string {
  try {
    // 1. Text Normalization
    let processedText = text.toLowerCase()  // Convert to lowercase
      .replace(/\s+/g, ' ')                // Replace multiple spaces with single space
      .replace(/[\r\n]+/g, ' ')            // Replace newlines with space
      .replace(/[^\w\s]/g, '')             // Remove all non-word characters (punctuation)
      .replace(/\d+/g, '')                 // Remove numbers
      .trim();                             // Remove leading/trailing spaces

    // 2. Tokenization
    const tokens = tokenizer.tokenize(processedText);
    if (!tokens) return text;

    // 3. Stop Words Removal (expanded list)
    const customStopwords = [
      ...stopwords.english,
      'etc', 'ie', 'eg', 'example', 'using', 'show', 'result', 'large', 'also',
      'within', 'across', 'among', 'besides', 'however', 'yet', 'therefore',
      ...['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
      ...['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      ...['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    ];

    const filteredTokens = tokens.filter(token => 
      !customStopwords.includes(token) && 
      token.length > 2  // Remove short words
    );

    // 4. Stemming with Porter Stemmer
    const stemmedTokens = filteredTokens.map(token => 
      stemmer.stem(token)
    );

    // 5. Lemmatization
    const lemmatizedTokens = stemmedTokens.map(token => 
      lemmatizer.lemmatize(token)
    );

    // 6. Additional Processing
    const processedTokens = lemmatizedTokens
      .filter(token => token.length > 1)    // Remove single characters
      .filter(Boolean)                      // Remove empty strings
      .map(token => token.trim())          // Trim each token
      .filter(token => !/^\d+$/.test(token)); // Remove pure numeric tokens

    // 7. Join and Final Cleanup
    const finalText = processedTokens
      .join(' ')
      .replace(/\s+/g, ' ')  // Final space cleanup
      .trim();

    return finalText;
  } catch (error) {
    console.error('Error in NLP preprocessing:', error);
    return text;
  }
} 