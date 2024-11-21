import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatResponse(
  question: string,
  pdfContent: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based on the provided PDF content. 
                   Only use information from the PDF to answer questions. 
                   If the answer cannot be found in the PDF, say so.
                   Sometimes you can answer questions based on sentiment if asked.`
        },
        {
          role: "user",
          content: `PDF Content: ${pdfContent}\n\nQuestion: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get response from OpenAI');
  }
}
