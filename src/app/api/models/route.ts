import { NextResponse } from 'next/server';
import { availableModels } from '@/config/models';  

export async function GET() {
  try {
 
    return NextResponse.json(availableModels);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to load models' }, { status: 500 });
  }
} 