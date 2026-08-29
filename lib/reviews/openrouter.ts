import OpenAI from 'openai';

// OpenRouter uses OpenAI-compatible API
const openrouter = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://alphaai.usethesetools.com',
    'X-Title': 'Alpha AI',
  },
});

export async function generateReply(reviewText: string, businessName: string): Promise<string> {
  const prompt = `You are a professional business owner. Write a brief, personalised reply to the following 5-star review for ${businessName}. Keep it warm and appreciative, under 100 words.\n\nReview: "${reviewText}"\n\nReply:`;

  const completion = await openrouter.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that writes professional replies to reviews.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Thank you for your review!';
}
