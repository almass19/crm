import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireRoles } from '@/lib/supabase/auth-helpers';
import { snakeToCamel } from '@/lib/utils/case-transform';

const taskSelect = `
  *,
  client:clients!tasks_client_id_fkey(id, full_name, company_name),
  creator:profiles!tasks_creator_id_fkey(id, full_name, role),
  assignee:profiles!tasks_assignee_id_fkey(id, full_name, role)
`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tasks')
      .select(taskSelect)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: 'Задача не найдена' }, { status: 404 });
    }

    return NextResponse.json(snakeToCamel(data));
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ message: 'Задача не найдена' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assigneeId !== undefined) updateData.assignee_id = body.assigneeId;
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(taskSelect)
      .single();

    if (error) throw error;

    return NextResponse.json(snakeToCamel(data));
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRoles('ADMIN');
    const { id } = await params;
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ message: 'Задача не найдена' }, { status: 404 });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
