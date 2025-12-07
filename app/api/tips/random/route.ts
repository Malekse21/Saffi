import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  // Better JS Random approach to avoid SQL extensions issues:
  const randomId = Math.floor(Math.random() * 50) + 1;
  const { data: tip } = await supabase.from('medical_tips').select('*').eq('id', randomId).single();

  return NextResponse.json(tip || { content: "Respirez...", icon_name: "Smile" });
}
