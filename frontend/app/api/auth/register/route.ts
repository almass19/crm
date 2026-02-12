import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { message: 'Email, пароль и ФИО обязательны' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { message: 'Пользователь с таким email уже существует' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { message: error.message },
        { status: 400 },
      );
    }

    // Wait briefly for the trigger to create the profile
    // Then fetch the profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', data.user!.id)
      .single();

    return NextResponse.json({
      user: {
        id: profile?.id || data.user!.id,
        email: profile?.email || email,
        fullName: profile?.full_name || fullName,
        role: profile?.role || null,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Ошибка сервера' },
      { status: 500 },
    );
  }
}
