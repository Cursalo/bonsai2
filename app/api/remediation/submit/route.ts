import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema for expected request body
const followUpSubmissionSchema = z.object({
  missedModeledQuestionId: z.string(), // Context: which original question led to this practice
  answers: z.record(z.string(), z.string()) // { [followUpQId]: selectedOptionId }
});

// Type for questions needed for grading
type FollowUpForGrading = {
    id: string;
    correct_option_id: string | null;
};

// Define Mastery Criteria
const MASTERY_THRESHOLD = 2; // e.g., 2 out of 3 correct

export async function POST(request: Request) {
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
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const validationResult = followUpSubmissionSchema.safeParse(payload);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid submission format', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }
  const { missedModeledQuestionId, answers } = validationResult.data;
  const followUpQuestionIdsSubmitted = Object.keys(answers);

  console.log(`Received follow-up answers for original question ${missedModeledQuestionId} from user ${userId}`);

  try {
    // 3. Fetch Correct Answers for the submitted Follow-up Questions
    const { data: correctAnswersData, error: fetchError } = await supabase
      .from('modeled_questions')
      .select('id, correct_option_id')
      .in('id', followUpQuestionIdsSubmitted)
      .returns<FollowUpForGrading[]>();
      
    if (fetchError) {
      console.error("Error fetching correct answers for follow-up:", fetchError);
      return NextResponse.json({ message: 'Failed to retrieve answers for grading.' }, { status: 500 });
    }
    if (!correctAnswersData || correctAnswersData.length !== followUpQuestionIdsSubmitted.length) {
         console.warn("Mismatch between submitted answers and fetched questions for grading.");
        // Handle this? Maybe return error or proceed with available data?
        return NextResponse.json({ message: 'Could not verify all submitted questions.' }, { status: 400 });
    }

    // Create a map for easy lookup
    const correctAnswersMap = new Map(correctAnswersData.map(q => [q.id, q.correct_option_id]));

    // 4. Evaluate Answers
    let correctCount = 0;
    for (const followUpQId of followUpQuestionIdsSubmitted) {
      const selectedOptionId = answers[followUpQId];
      const correctOptionId = correctAnswersMap.get(followUpQId);
      if (correctOptionId && selectedOptionId === correctOptionId) {
        correctCount++;
      }
    }

    // 5. Determine Mastery
    const mastered = correctCount >= MASTERY_THRESHOLD;
    const totalQuestions = followUpQuestionIdsSubmitted.length;
    console.log(`Follow-up results for ${missedModeledQuestionId}: ${correctCount}/${totalQuestions}. Mastered: ${mastered}`);

    // 6. TODO: Update User Skill/Mastery Status (Step 5 logic)
    if (mastered) {
        // Fetch concept_tag associated with missedModeledQuestionId
        const { data: conceptData, error: conceptError } = await supabase
            .from('modeled_questions')
            .select('concept_tag')
            .eq('id', missedModeledQuestionId)
            .single();
        
        if (conceptError || !conceptData?.concept_tag) {
            console.warn(`Could not find concept tag for mastered question ${missedModeledQuestionId} to update status.`);
        } else {
             const conceptTag = conceptData.concept_tag;
            // Example: Upsert into a user_skills table
            const { error: skillUpdateError } = await supabase
                .from('user_skills') // Ensure this table exists
                .upsert({ 
                    user_id: userId,
                    concept_tag: conceptTag,
                    status: 'mastered', 
                    last_updated: new Date().toISOString()
                 }, { onConflict: 'user_id, concept_tag' }); // Assumes composite primary/unique key
                 
            if (skillUpdateError) {
                 console.error(`Failed to update skill status for user ${userId}, concept ${conceptTag}:`, skillUpdateError);
                 // Non-critical? Log and continue, or return specific error?
            }
            else {
                console.log(`Updated skill status for user ${userId}, concept ${conceptTag} to mastered.`);
            }
        }
    }

    // 7. Return Result
    return NextResponse.json({
        message: `Practice complete. ${correctCount}/${totalQuestions} correct.`,
        mastered: mastered,
        correctCount: correctCount,
        totalQuestions: totalQuestions
    }, { status: 200 });

  } catch (error) {
    console.error(`Error processing follow-up submission for ${missedModeledQuestionId}:`, error);
    return NextResponse.json({ message: 'Failed to process practice submission.' }, { status: 500 });
  }
} 