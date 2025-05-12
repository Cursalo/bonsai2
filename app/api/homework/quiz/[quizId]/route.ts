import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { quizId: string } } // Get quizId from route parameters
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

  // Get user ID for authorization
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

  try {
    // Fetch the main quiz data, ensuring it belongs to the logged-in user
    const { data: quizData, error: quizError } = await supabase
      .from('user_quizzes')
      .select('id, status, created_at, source_official_test_id')
      .eq('id', quizId)
      .eq('user_id', userId) // Authorize: Ensure user owns this quiz
      .single();

    if (quizError) {
       if (quizError.code === 'PGRST116') { // Not found or user doesn't own it
         return NextResponse.json({ message: 'Quiz not found or access denied.' }, { status: 404 });
       }
       console.error('Error fetching quiz:', quizError);
       return NextResponse.json({ message: 'Failed to fetch quiz data.' }, { status: 500 });
    }

    if (!quizData) {
       return NextResponse.json({ message: 'Quiz not found or access denied.' }, { status: 404 });
    }

    // Fetch associated questions, JOINING with modeled_questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('quiz_questions')
      // Simplified select string for JOIN
      .select('id, order, modeled_questions(id, question_text, options)')
      .eq('quiz_id', quizId)
      .order('order', { ascending: true }); 

    if (questionsError) {
      console.error('Error fetching quiz questions with details:', questionsError);
      return NextResponse.json({ message: 'Failed to fetch full quiz question details.' }, { status: 500 });
    }

    // Process the joined data (Ensure Supabase returns data in this nested structure)
    const processedQuestions = (questionsData || []).map((q: any) => { // Use 'any' temporarily if type inference is failing
      // Check if modeled_questions exists and has data before accessing its properties
      const modeledQuestion = q.modeled_questions;
      return {
        id: q.id, 
        order: q.order,
        modeled_question_id: modeledQuestion?.id,
        text: modeledQuestion?.question_text,
        options: modeledQuestion?.options,
      };
    }).filter(q => q.modeled_question_id); // Filter out any questions where the join failed

    // Combine quiz data and processed questions data
    const fullQuizData = {
      ...quizData,
      questions: processedQuestions,
    };

    return NextResponse.json(fullQuizData);

  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while fetching the quiz.' }, { status: 500 });
  }
} 