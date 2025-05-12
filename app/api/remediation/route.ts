import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Define structure for remediation content
interface RemediationItem {
  missedModeledQuestionId: string;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  followUpQuestions: {
    id: string;
    text: string;
    options: any; // Adjust based on your options structure
  }[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('modeledQuestionIds');

  if (!idsParam) {
    return NextResponse.json({ message: 'Missing modeledQuestionIds query parameter' }, { status: 400 });
  }

  // Split and validate IDs (basic validation)
  const missedModeledQuestionIds = idsParam.split(',').filter(id => id.trim() !== '');
  if (missedModeledQuestionIds.length === 0) {
    return NextResponse.json({ message: 'No valid modeledQuestionIds provided' }, { status: 400 });
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

  // --- Authentication (Optional but recommended) ---
  // You might want to ensure the user fetching remediation is logged in,
  // although the content itself isn't user-specific based on IDs alone.
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }
  // --- End Authentication ---

  try {
    const remediationData: RemediationItem[] = [];

    // Fetch details for the missed questions (to get concept tags, video, pdf)
    const { data: missedQuestionsData, error: missedFetchError } = await supabase
      .from('modeled_questions')
      .select('id, video_url, pdf_url, concept_tag')
      .in('id', missedModeledQuestionIds);

    if (missedFetchError) {
      console.error("Error fetching missed question details:", missedFetchError);
      return NextResponse.json({ message: 'Failed to fetch details for missed questions.' }, { status: 500 });
    }

    if (!missedQuestionsData || missedQuestionsData.length === 0) {
        return NextResponse.json({ message: 'Could not find details for the provided question IDs.' }, { status: 404 });
    }

    // Process each missed question to find follow-ups
    for (const missedQ of missedQuestionsData) {
      let followUpQuestionsData: any[] = [];

      if (missedQ.concept_tag) {
        // Fetch 3 other distinct questions with the same concept_tag
        const { data: followUps, error: followUpError } = await supabase
          .from('modeled_questions')
          .select('id, question_text, options') // Select necessary fields for display
          .eq('concept_tag', missedQ.concept_tag) // Match the concept
          .neq('id', missedQ.id) // Exclude the original question
          .limit(3); // Limit to 3

        if (followUpError) {
          console.error(`Error fetching follow-up questions for concept ${missedQ.concept_tag}:`, followUpError);
          // Decide whether to fail entirely or just skip follow-ups for this concept
        } else {
          followUpQuestionsData = (followUps || []).map(fq => ({
              id: fq.id,
              text: fq.question_text,
              options: fq.options
          }));
        }
      } else {
          console.warn(`Missed question ${missedQ.id} has no concept_tag, cannot fetch follow-up questions.`);
      }

      remediationData.push({
        missedModeledQuestionId: missedQ.id,
        videoUrl: missedQ.video_url,
        pdfUrl: missedQ.pdf_url,
        followUpQuestions: followUpQuestionsData,
      });
    }

    return NextResponse.json(remediationData);

  } catch (error) {
    console.error('Error fetching remediation content:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while fetching remediation content.' }, { status: 500 });
  }
} 