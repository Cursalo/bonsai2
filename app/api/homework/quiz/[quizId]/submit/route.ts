import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Define the schema for the expected request body (answers object)
// Keys are quiz_question_ids (string/uuid), values are selected_option_ids (string/uuid)
const submissionSchema = z.record(z.string(), z.string());

// Define a type for the joined question data we need for processing
// Adjust based on your actual modeled_questions table structure
type QuestionForProcessing = {
  id: string; // quiz_questions.id
  modeled_questions: {
    id: string; // modeled_questions.id
    correct_option_id: string | null; // Assuming this exists
    // Add concept tags if needed for remediation
    // concept_tags?: string[]; 
  } | null;
};

export async function POST(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  const quizId = params.quizId;
  if (!quizId) {
    return NextResponse.json({ message: 'Quiz ID is required' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set(name, value, options) },
        remove(name: string, options: CookieOptions) { cookieStore.set(name, '', options) },
      },
    }
  );

  // 1. Authenticate User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // 2. Parse and Validate Payload
  let submittedAnswers;
  try {
    submittedAnswers = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const validationResult = submissionSchema.safeParse(submittedAnswers);
  if (!validationResult.success) {
    console.error("Submission Validation Error:", validationResult.error.errors);
    return NextResponse.json(
      { message: 'Invalid submission format', errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const answers = validationResult.data;
  const quizQuestionIdsSubmitted = Object.keys(answers);

  console.log(`Received submission for quiz ${quizId} from user ${userId} with ${quizQuestionIdsSubmitted.length} answers.`);

  try {
    // 3a. Verify Quiz State and Ownership
    const { data: quizData, error: quizFetchError } = await supabase
      .from('user_quizzes')
      .select('id, status')
      .eq('id', quizId)
      .eq('user_id', userId)
      .single();

    if (quizFetchError || !quizData) {
      return NextResponse.json({ message: 'Quiz not found or access denied.' }, { status: 404 });
    }
    if (quizData.status !== 'pending') { // Check if quiz is already submitted/completed
      return NextResponse.json({ message: `Quiz already submitted (Status: ${quizData.status})` }, { status: 409 }); // 409 Conflict
    }

    // 3b & 3d. Fetch Quiz Questions and Correct Answers
    const { data: questionsForProcessing, error: questionsFetchError } = await supabase
      .from('quiz_questions')
      .select(`
        id, 
        modeled_questions (
          id,
          correct_option_id 
          // concept_tags // Include if needed
        )
      `)
      .eq('quiz_id', quizId)
      .returns<QuestionForProcessing[]>(); // Add type hint

    if (questionsFetchError) {
      console.error('Error fetching questions for processing:', questionsFetchError);
      return NextResponse.json({ message: 'Failed to retrieve question details for grading.' }, { status: 500 });
    }
    if (!questionsForProcessing || questionsForProcessing.length === 0) {
      return NextResponse.json({ message: 'No questions found associated with this quiz.' }, { status: 404 });
    }

    // 3c. Check if all expected questions were answered
    if (quizQuestionIdsSubmitted.length !== questionsForProcessing.length) {
      return NextResponse.json({ message: `Submission incomplete. Expected ${questionsForProcessing.length} answers, received ${quizQuestionIdsSubmitted.length}.` }, { status: 400 });
    }

    // 3e & 3f & 3g. Compare Answers, Store Results, Identify Missed Concepts
    let correctCount = 0;
    const answerResultsToInsert: any[] = [];
    const missedConcepts: string[] = []; // Store modeled_question_id for incorrect answers

    for (const question of questionsForProcessing) {
      const quizQuestionId = question.id;
      const selectedOptionId = answers[quizQuestionId];
      const modeledQuestionData = question.modeled_questions;

      // Handle case where join might have failed for a specific question
      if (!modeledQuestionData || selectedOptionId === undefined) {
        console.warn(`Skipping grading for quiz_question_id ${quizQuestionId} due to missing data or submission.`);
        continue; // Or handle as incorrect?
      }

      const isCorrect = modeledQuestionData.correct_option_id === selectedOptionId;
      if (isCorrect) {
        correctCount++;
      } else {
        missedConcepts.push(modeledQuestionData.id); // Store modeled_question_id of incorrect question
      }

      answerResultsToInsert.push({
        quiz_id: quizId,
        quiz_question_id: quizQuestionId,
        user_id: userId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        // submitted_at: handled by default value in DB
      });
    }

    // Insert all answer results
    const { error: insertAnswersError } = await supabase
      .from('user_answers') // Ensure this table exists
      .insert(answerResultsToInsert);

    if (insertAnswersError) {
      console.error('Error saving answer results:', insertAnswersError);
      // Rollback or compensation logic might be needed here in a real app
      return NextResponse.json({ message: 'Failed to save quiz results.' }, { status: 500 });
    }

    // Update the main quiz status to 'completed' (or 'graded')
    const { error: updateQuizError } = await supabase
      .from('user_quizzes')
      .update({ status: 'completed' })
      .eq('id', quizId);

    if (updateQuizError) {
      console.error('Error updating quiz status:', updateQuizError);
      // Handle error, potentially alert monitoring
    }

    // 4. Return Results
    const score = (correctCount / questionsForProcessing.length) * 100;

    return NextResponse.json({
      message: 'Quiz submitted and graded successfully!',
      results: {
        totalQuestions: questionsForProcessing.length,
        correctCount: correctCount,
        score: parseFloat(score.toFixed(1)), // Keep one decimal place
        // Send back the IDs of the *modeled questions* that were answered incorrectly
        missedModeledQuestionIds: missedConcepts, 
      }
    }, { status: 200 });

  } catch (error) {
    console.error(`Error processing submission for quiz ${quizId}:`, error);
    return NextResponse.json({ message: 'Failed to process quiz submission.' }, { status: 500 });
  }
} 