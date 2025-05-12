'use server' // Mark this module as server-only

/**
 * BotSai API integration for Bonsai Prep using OpenAI
 */
import OpenAI from 'openai';

// Define the structure for conversation messages
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Function to generate a response from BotSai API using OpenAI
export async function generateBotSaiResponse(prompt: string, history: ChatMessage[] = []): Promise<string> {
  try {
    // Read the server-side API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not defined.');
      throw new Error('OpenAI API key is not configured on the server');
    }

    // Initialize OpenAI client (server-side only)
    const openai = new OpenAI({
      apiKey: apiKey,
      // dangerouslyAllowBrowser: true, // REMOVED - Not needed and insecure for server-side keys
    });

    // Construct messages including history and the new prompt
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "You are BonsAI, a helpful and encouraging AI tutor specializing in SAT and PSAT preparation. Keep your responses concise, informative, and supportive. Focus on explaining concepts clearly and providing actionable study advice."
      },
      ...history, // Spread the existing conversation history
      { role: 'user', content: prompt } // Add the new user prompt
    ];

    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      model: 'gpt-4o-mini', // Use the desired model
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    });

    // Extract the text from the response
    const generatedText = chatCompletion.choices[0]?.message?.content || 'No response generated';

    return generatedText;
  } catch (error) {
    console.error('Error generating OpenAI response:', error);
    if (error instanceof OpenAI.APIError) {
        return `Sorry, I encountered an API error (${error.status}): ${error.message}`;
    }
    // Provide a more generic error message to the user
    return 'Sorry, I encountered an error trying to generate a response. Please check the server logs.';
  }
}

// Function to generate a study plan
export async function generateStudyPlan(subject: string, level: string): Promise<string> {
  const prompt = `Create a detailed study plan for a student preparing for ${subject} at ${level} level.
  Include specific topics to cover, recommended resources, and a weekly schedule.`;

  // Note: History is not passed here, assuming these are single-turn requests
  return generateBotSaiResponse(prompt);
}

// Function to explain a concept
export async function explainConcept(concept: string): Promise<string> {
  const prompt = `Explain the following concept in simple terms, with examples: ${concept}`;

  // Note: History is not passed here
  return generateBotSaiResponse(prompt);
}

// Function to generate practice questions
export async function generatePracticeQuestions(topic: string, difficulty: string, count: number): Promise<string> {
  const prompt = `Generate ${count} ${difficulty} level practice questions about ${topic}.
  Include answers and explanations for each question.`;

  // Note: History is not passed here
  return generateBotSaiResponse(prompt);
}

// Function to provide feedback on homework
export async function provideHomeworkFeedback(submission: string): Promise<string> {
  const prompt = `Provide detailed feedback on the following homework submission.
  Highlight strengths, areas for improvement, and suggest next steps:

  ${submission}`;

  // Note: History is not passed here
  return generateBotSaiResponse(prompt);
}