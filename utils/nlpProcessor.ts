import natural from 'natural';
import stopwords from 'stopwords';
import lemmatizer from 'lemmatizer';

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

export function preprocessText(text: string): string {
  try {
    // 1. Normalize text
    let cleaned = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^\w\s]/g, '')  // remove punctuation
      .replace(/\d+/g, '')      // remove numbers
      .trim();

    // 2. Tokenize
    const tokens = tokenizer.tokenize(cleaned);
    if (!tokens || tokens.length === 0) return '';

    // 3. Stopwords
    const customStopwords = [
      ...stopwords.english,
      'etc', 'ie', 'eg', 'example', 'using', 'show', 'result', 'large', 'also',
      'within', 'across', 'among', 'besides', 'however', 'yet', 'therefore',
      ...['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
      ...['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      ...['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    ];

    const filtered = tokens.filter(token => 
      !customStopwords.includes(token) && token.length > 2 && !/^\d+$/.test(token)
    );

    if (filtered.length === 0) return '';

    // 4. Stemming + Lemmatization
    const finalTokens = filtered
      .map(t => stemmer.stem(t))
      .map(t => lemmatizer(t))
      .filter(token => token.length > 1)
      .map(token => token.trim());

    // 5. Recombine
    const result = finalTokens.join(' ').replace(/\s+/g, ' ').trim();
    return result;

  } catch (error) {
    console.error('Error in preprocessText:', error);
    return '';
  }
}
