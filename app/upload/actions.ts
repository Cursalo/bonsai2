'use server'

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the schema for the form data including the file
const UploadSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, 'File is required.')
           .refine(file => file.size < 10 * 1024 * 1024, 'File size must be less than 10MB.')
           // Consider adding more specific file type checks if needed
});

// Define the structure for the analysis result
interface AnalysisResult {
  success: boolean;
  message: string;
  missedSkills?: string[]; // Example: ['Linear Equations', 'Comma Usage']
}

export async function analyzePracticeTest(prevState: AnalysisResult | null, formData: FormData): Promise<AnalysisResult> {
  // Validate form data
  const validatedFields = UploadSchema.safeParse({
    file: formData.get('file-upload'),
  });

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    const firstError = validatedFields.error.flatten().fieldErrors.file?.[0] || 'Invalid file provided.';
    return { success: false, message: firstError };
  }

  const { file } = validatedFields.data;
  console.log(`Received file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

  try {
    // Read file content as text (assuming text-based input for now)
    // NOTE: For PDF/Images, OCR pre-processing would be needed here.
    const fileContent = await file.text();
    console.log('File content read.');

    // --- STEP 2: AI Analysis --- 
    console.log('Starting AI analysis with gpt-4o-mini...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the requested model
      // response_format: { type: "json_object" }, // Consider using JSON mode for structured output
      messages: [
        {
          role: "system",
          content: `You are an expert SAT tutor assistant. Analyze the provided text content which represents a student's answers or notes from an SAT practice test. Identify the questions the student likely missed or struggled with. For each identified area of difficulty, determine the core academic skill being tested (e.g., Solving Linear Equations, Identifying Main Idea, Comma Usage, Interpreting Scatterplots, Subject-Verb Agreement, Analyzing Tone). Respond ONLY with a JSON object containing a single key "missedSkills" which is an array of strings listing these unique skills. If no specific missed skills can be determined, return an empty array.`
        },
        {
          role: "user",
          content: fileContent // Provide the file content directly to the model
        }
      ],
      temperature: 0.2, // Lower temperature for more focused, less creative output
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('AI analysis returned an empty response.');
    }

    console.log('Raw AI Response:', responseContent);

    // Parse the response to extract skills
    let missedSkills: string[] = [];
    try {
      // Attempt to parse assuming the model followed JSON instructions (even without response_format)
      const parsedResponse = JSON.parse(responseContent);
      if (parsedResponse.missedSkills && Array.isArray(parsedResponse.missedSkills)) {
         // Basic validation that elements are strings
         missedSkills = parsedResponse.missedSkills.filter((skill: any) => typeof skill === 'string');
      } else {
          console.warn('AI response was valid JSON but did not contain expected missedSkills array.');
          // Fallback: Try to extract skills from plain text list if JSON failed
          missedSkills = responseContent.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s.length < 100); 
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON. Attempting fallback extraction.', parseError);
      // Fallback: Extract skills from plain text list if JSON parsing fails
      missedSkills = responseContent.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s.length < 100); 
    }

    console.log('AI Analysis successful. Parsed missed skills:', missedSkills);

    if (missedSkills.length === 0) {
        return {
          success: true,
          message: 'Analysis complete. No specific missed skills identified in the upload.',
          missedSkills: []
        };
    }

    // TODO: Store missed skills temporarily or trigger quiz generation (Step 3)

    return {
      success: true,
      message: 'Analysis complete. Custom quiz generation will follow based on these skills.',
      missedSkills: missedSkills
    };

  } catch (error) {
    console.error('Error during AI processing or file handling:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
    // Provide more specific feedback if it's an API error
    if (error instanceof OpenAI.APIError) {
        return { success: false, message: `AI API Error (${error.status}): ${error.message}` };
    }
    return {
      success: false,
      message: `Processing failed: ${errorMessage}`
    };
  }
} 