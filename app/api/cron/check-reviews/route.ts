import { NextResponse } from 'next/server';
import { processNewReviews } from '@/lib/reviews/processor';

// Prevent Next.js from aggressively caching this route
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Triggers the loop through all clients to fetch and queue review replies
    await processNewReviews();
    return NextResponse.json({ success: true, message: 'Review check completed' });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process reviews' }, { status: 500 });
  }
}