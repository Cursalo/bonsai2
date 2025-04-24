/**
 * BotSai API integration for Bonsai Prep using OpenAI
 */
import OpenAI from 'openai';

// Function to generate a response from BotSai API using OpenAI
export async function generateBotSaiResponse(prompt: string): Promise<string> {
  try {
    // Read the API key from the server-side environment variable
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      console.error('NEXT_PUBLIC_OPENAI_API_KEY environment variable is not defined.');
      throw new Error('OpenAI API key is not configured');
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Allow client-side usage as per NEXT_PUBLIC_ prefix
    });

    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo', // Or use 'gpt-4' if preferred and available
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    });

    // Extract the text from the response
    const generatedText = chatCompletion.choices[0]?.message?.content || 'No response generated';

    return generatedText;
  } catch (error) {
    console.error('Error generating OpenAI response:', error);
    // Provide a more generic error message to the user
    return 'Sorry, I encountered an error trying to generate a response. Please check the server logs.';
  }
}

// Function to generate a study plan
export async function generateStudyPlan(subject: string, level: string): Promise<string> {
  const prompt = `Create a detailed study plan for a student preparing for ${subject} at ${level} level.
  Include specific topics to cover, recommended resources, and a weekly schedule.`;

  return generateBotSaiResponse(prompt);
}

// Function to explain a concept
export async function explainConcept(concept: string): Promise<string> {
  const prompt = `Explain the following concept in simple terms, with examples: ${concept}`;

  return generateBotSaiResponse(prompt);
}

// Function to generate practice questions
export async function generatePracticeQuestions(topic: string, difficulty: string, count: number): Promise<string> {
  const prompt = `Generate ${count} ${difficulty} level practice questions about ${topic}.
  Include answers and explanations for each question.`;

  return generateBotSaiResponse(prompt);
}

// Function to provide feedback on homework
export async function provideHomeworkFeedback(submission: string): Promise<string> {
  const prompt = `Provide detailed feedback on the following homework submission.
  Highlight strengths, areas for improvement, and suggest next steps:

  ${submission}`;

  return generateBotSaiResponse(prompt);
}