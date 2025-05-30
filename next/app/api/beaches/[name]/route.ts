import { NextResponse } from 'next/server';
import { beachData } from '@/app/types/beaches';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const beachName = decodeURIComponent(params.name);
  const beach = beachData.find(b => b.name === beachName);

  if (!beach) {
    return NextResponse.json(
      { error: 'Beach not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(beach);
} 