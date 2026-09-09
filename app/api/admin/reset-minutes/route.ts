import { NextRequest, NextResponse } from 'next/server';
import { checkAndResetAllClients } from '@/lib/call-limits';

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resetCount = await checkAndResetAllClients();

    return NextResponse.json({
      success: true,
      reset_count: resetCount,
      message: `Minutes reset for ${resetCount} clients`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}