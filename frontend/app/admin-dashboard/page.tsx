'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import MonthSelector from '@/components/MonthSelector';
import StatusBadge from '@/components/StatusBadge';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface DashboardClient {
  id: string;
  fullName: string | null;
  companyName: string | null;
  phone: string;
  email: string;
  status: string;
  services: string[];
  createdAt: string;
  assignedAt: string | null;
  designerAssignedAt: string | null;
}

interface DashboardData {
  count: number;
  clients: DashboardClient[];
  month: number;
  year: number;
  role: string;
  user?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'ADMIN') {
      router.replace('/clients');
      return;
    }
    if (user) {
      api.getEmployees().then(setEmployees).catch(() => {});
    }
  }, [authLoading, user, router]);

  const fetchEmployeeDashboard = useCallback(async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getUserDashboard(
        selectedEmployeeId,
        selectedYear,
        selectedMonth
      );
      setDashboardData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeDashboard();
    } else {
      setDashboardData(null);
    }
  }, [selectedEmployeeId, selectedYear, selectedMonth, fetchEmployeeDashboard]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  const getRoleDashboardTitle = (role: string) => {
    switch (role) {
      case 'SPECIALIST':
        return 'Клиенты (принятые в работу)';
      case 'DESIGNER':
        return 'Клиенты (принятые в работу)';
      case 'SALES_MANAGER':
        return 'Созданные клиенты';
      default:
        return 'Клиенты';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Дашборды сотрудников
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[300px]"
          >
            <option value="">Выберите сотрудника</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({ROLE_LABELS[emp.role] || emp.role})
              </option>
            ))}
          </select>

          <MonthSelector
            year={selectedYear}
            month={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        </div>

        {!selectedEmployeeId ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            Выберите сотрудника для просмотра статистики
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-gray-500">Загрузка...</div>
        ) : dashboardData ? (
          <>
            {/* Employee Info & Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {dashboardData.user?.fullName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {ROLE_LABELS[dashboardData.user?.role || ''] || dashboardData.user?.role}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm text-gray-500 mb-1">
                  {getRoleDashboardTitle(dashboardData.role)}
                </h3>
                <div className="text-4xl font-bold text-blue-600">
                  {dashboardData.count}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  клиентов за выбранный месяц
                </p>
              </div>
            </div>

            {/* Clients Table */}
            {dashboardData.clients.length > 0 ? (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Имя / Компания
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Контакты
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Услуги
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.clients.map((client) => (
                      <tr
                        key={client.id}
                        onClick={() => router.push(`/clients/${client.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {client.fullName || client.companyName}
                          </div>
                          {client.fullName && client.companyName && (
                            <div className="text-xs text-gray-500">
                              {client.companyName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{client.phone}</div>
                          <div className="text-xs">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {client.services?.join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={client.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(
                            client.assignedAt || client.designerAssignedAt || client.createdAt
                          ).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                Нет клиентов за выбранный период
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
