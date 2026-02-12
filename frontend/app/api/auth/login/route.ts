import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email и пароль обязательны' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { message: 'Неверный email или пароль' },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: profile!.id,
        email: profile!.email,
        fullName: profile!.full_name,
        role: profile!.role,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Ошибка сервера' },
      { status: 500 },
    );
  }
}
