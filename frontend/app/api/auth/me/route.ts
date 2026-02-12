import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: 'Не авторизован' },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { message: 'Профиль не найден' },
        { status: 401 },
      );
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      createdAt: profile.created_at,
    });
  } catch {
    return NextResponse.json(
      { message: 'Ошибка сервера' },
      { status: 500 },
    );
  }
}
