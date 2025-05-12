import { NextResponse } from 'next/server';
import { z } from 'zod';
// Correct import for server-side client creation in Route Handlers/Server Components
import { createServerClient, type CookieOptions } from '@supabase/ssr'; 
import { cookies } from 'next/headers';

// Define the schema for manual entry (used if file isn't present)
const missedQuestionSchema = z.object({
  section: z.string().min(1, 'Section is required'),
  questionNumber: z.coerce.number().min(1, 'Question number must be at least 1'),
});

// Define the main form schema (same as frontend)
const mistakeUploadSchema = z.object({
  testId: z.string().min(1, 'Please select a test'),
  missedQuestions: z.array(missedQuestionSchema).min(1, 'Please add at least one missed question'),
});

export async function POST(request: Request) {
  // Revert cookie handling to standard practice, acknowledging potential linter noise
  const cookieStore = cookies(); 
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options); 
        },
      },
    }
  );

  // 1. Get User ID
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth Error:', authError);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  // --- Handle FormData --- 
  let testId: string | null = null;
  let uploadedFile: File | null = null;
  let missedQuestionsManual: any[] | null = null; 
  
  try {
    const formData = await request.formData();
    testId = formData.get('testId') as string | null;
    uploadedFile = formData.get('file') as File | null;
    const missedQuestionsJson = formData.get('missedQuestions') as string | null;

    if (missedQuestionsJson) {
        missedQuestionsManual = JSON.parse(missedQuestionsJson);
        // Optional: Validate parsed manual questions using Zod
        const manualSchema = z.array(missedQuestionSchema);
        const validation = manualSchema.safeParse(missedQuestionsManual);
        if (!validation.success) {
            console.error("Manual entry validation failed:", validation.error);
            return NextResponse.json({ message: 'Invalid format for manually entered questions.' }, { status: 400 });
        }
        missedQuestionsManual = validation.data; // Use validated data
    }

  } catch (error) {
    console.error("Error parsing FormData:", error);
    return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
  }
  // --- End FormData Handling ---

  // Validate required fields
  if (!testId) {
      return NextResponse.json({ message: 'Test ID is required.' }, { status: 400 });
  }
  if (!uploadedFile && !missedQuestionsManual) {
      return NextResponse.json({ message: 'Either a file upload or manual question entry is required.' }, { status: 400 });
  }

  let missedQuestionsToProcess: z.infer<typeof missedQuestionSchema>[] = [];
  let processingMode: 'file' | 'manual' = 'manual'; // Default

  if (uploadedFile) {
     processingMode = 'file';
     console.log(`Processing uploaded file: ${uploadedFile.name}, Size: ${uploadedFile.size}, Type: ${uploadedFile.type}`);
     // --- TODO: Implement File Parsing Logic --- 
     // 1. Store the file (e.g., in Supabase Storage)
     // 2. Trigger an async parsing job (e.g., call external OCR/parsing service, use a serverless function)
     // 3. For now, we'll return an error/placeholder message indicating parsing is needed.
     //    OR: We could extract some dummy questions for demo purposes.
     // Example (Dummy): 
     // missedQuestionsToProcess = [ { section: "Parsed Section", questionNumber: 1 }, { section: "Parsed Section", questionNumber: 5 }];
     console.warn("File parsing logic not implemented. Cannot generate quiz from file yet.");
     // For now, let's just use manual if both provided, or return error if only file
     if (!missedQuestionsManual) {
       return NextResponse.json({ message: 'File upload received, but processing/parsing is not yet implemented.' }, { status: 501 }); // 501 Not Implemented
     }
     console.log("File provided, but falling back to manual entry as parsing is not implemented.");
     missedQuestionsToProcess = missedQuestionsManual;
     processingMode = 'manual'; // Fallback
  } else if (missedQuestionsManual) {
     processingMode = 'manual';
     missedQuestionsToProcess = missedQuestionsManual;
     console.log(`Processing ${missedQuestionsToProcess.length} manually entered questions.`);
  } else {
     // Should be caught by earlier check, but as a safeguard:
      return NextResponse.json({ message: 'No questions submitted.' }, { status: 400 });
  }

  // --- Rest of the logic (Mapping, Quiz Creation) --- 
  // Uses `missedQuestionsToProcess` and `testId`
  console.log(`Processing mode: ${processingMode}`);
  try {
    // 2. Find corresponding Modeled Question IDs
    const mappedModeledQuestionIds: string[] = []; 
    const mappingErrors: any[] = [];
    for (const missed of missedQuestionsToProcess) {
      const { data: mappingData, error: mappingError } = await supabase
        .from('official_question_mapping') 
        .select('modeled_question_id') 
        .eq('official_test_id', testId)
        .eq('official_section', missed.section)
        .eq('official_question_number', missed.questionNumber)
        .single();

      if (mappingError) {
        if (mappingError.code === 'PGRST116') { 
           console.warn(`No mapping found for Test: ${testId}, Section: ${missed.section}, Q#: ${missed.questionNumber}`);
           mappingErrors.push({ ...missed, reason: 'No corresponding modeled question found.' });
        } else {
          console.error(`DB Error mapping question (T:${testId}, S:${missed.section}, Q:${missed.questionNumber}):`, mappingError);
          mappingErrors.push({ ...missed, reason: 'Database error during lookup.' });
        }
      } else if (mappingData?.modeled_question_id) { // Ensure ID exists
        mappedModeledQuestionIds.push(mappingData.modeled_question_id);
      }
    }
    console.log(`Successfully mapped ${mappedModeledQuestionIds.length} questions out of ${missedQuestionsToProcess.length} submitted.`);
    if (mappedModeledQuestionIds.length === 0) {
      return NextResponse.json({ message: 'Could not find corresponding practice questions for any of the submitted mistakes.', errors: mappingErrors }, { status: 400 }); // Use 400 Bad Request if no questions could be mapped
    }

    // Use Array.from for Set iteration to support older TS targets
    const uniqueModeledQuestionIds = Array.from(new Set(mappedModeledQuestionIds));

    // 3. Create the Quiz and link Questions
    
    // Start a transaction (recommended for multiple related inserts)
    // Note: Supabase JS client doesn't have direct transaction blocks like some ORMs.
    // We perform operations sequentially and handle errors.

    // Create the main quiz entry
    const { data: newQuizData, error: quizInsertError } = await supabase
      .from('user_quizzes')
      .insert({
        user_id: userId,
        status: 'pending', // Or 'ready'? Depends on flow
        source_official_test_id: testId
      })
      .select('id') // Select the ID of the newly created quiz
      .single();

    if (quizInsertError || !newQuizData?.id) {
      console.error('Error creating quiz entry:', quizInsertError);
      return NextResponse.json({ message: 'Failed to create quiz entry.' }, { status: 500 });
    }

    const newQuizId = newQuizData.id;
    console.log(`Created new quiz entry with ID: ${newQuizId}`);

    // Prepare data for quiz_questions insertion
    const quizQuestionsToInsert = uniqueModeledQuestionIds.map((modeledId, index) => ({
      quiz_id: newQuizId,
      modeled_question_id: modeledId, // Ensure this matches the FK type in your DB
      order: index + 1 // Assign order based on mapping sequence
    }));

    // Insert the questions linked to the quiz
    const { error: questionsInsertError } = await supabase
      .from('quiz_questions')
      .insert(quizQuestionsToInsert);

    if (questionsInsertError) {
      console.error('Error inserting quiz questions:', questionsInsertError);
      // Attempt to clean up the created quiz entry if questions fail?
      // await supabase.from('user_quizzes').delete().eq('id', newQuizId);
      return NextResponse.json({ message: 'Failed to link questions to the quiz.' }, { status: 500 });
    }

    console.log(`Successfully inserted ${quizQuestionsToInsert.length} questions for quiz ${newQuizId}`);

    // --- Return Success Response --- 
    const sourceType = processingMode === 'file' ? 'parsed' : 'manual';
    return NextResponse.json({
       message: `Successfully processed ${uniqueModeledQuestionIds.length}/${missedQuestionsToProcess.length} ${sourceType} questions. Personalized quiz created.`, 
       quizId: newQuizId, 
       unmappedCount: mappingErrors.length,
       unmappedDetails: mappingErrors,
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing mistake upload:', error);
    return NextResponse.json({ message: 'Failed to process submission due to an unexpected error.' }, { status: 500 });
  }
} 