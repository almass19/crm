import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    if (user.role !== 'ADMIN' && user.role !== 'SPECIALIST') {
      return NextResponse.json(
        { message: 'Недостаточно прав для просмотра продлений' },
        { status: 403 },
      );
    }

    const month = request.nextUrl.searchParams.get('month');

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { message: 'Некорректный формат месяца (YYYY-MM)' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('payments')
      .select(`
        *,
        client:clients!payments_client_id_fkey(
          id, full_name, company_name,
          assigned_to:profiles!clients_assigned_to_id_fkey(id, full_name)
        )
      `)
      .eq('is_renewal', true)
      .eq('month', month)
      .order('created_at', { ascending: false });

    // Specialist can only see renewals of their assigned clients
    if (user.role === 'SPECIALIST') {
      // We need to filter by clients assigned to this user
      // First get the client IDs assigned to this specialist
      const { data: assignedClients } = await supabase
        .from('clients')
        .select('id')
        .eq('assigned_to_id', user.id);

      const clientIds = (assignedClients || []).map((c) => c.id);
      if (clientIds.length === 0) {
        return NextResponse.json({
          month,
          totalRenewals: 0,
          clients: [],
        });
      }
      query = query.in('client_id', clientIds);
    }

    const { data: payments, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      month,
      totalRenewals: (payments || []).length,
      clients: (payments || []).map((p: Record<string, unknown>) => {
        const client = p.client as Record<string, unknown> | null;
        return {
          clientId: client?.id,
          clientName: client?.full_name || client?.company_name,
          amount: p.amount,
          renewedAt: typeof p.created_at === 'string'
            ? p.created_at.split('T')[0]
            : p.created_at,
          specialist: client?.assigned_to || null,
        };
      }),
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
