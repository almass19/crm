'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { STATUS_LABELS, ROLE_LABELS } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';

interface Client {
  id: string;
  fullName: string | null;
  companyName: string | null;
  phone: string;
  email: string;
  source: string;
  notes: string | null;
  status: string;
  assignmentSeen: boolean;
  createdAt: string;
  assignedAt: string | null;
  createdBy: { id: string; fullName: string; role: string };
  assignedTo: { id: string; fullName: string; role: string } | null;
  assignmentHistory: {
    id: string;
    assignedAt: string;
    specialist: { fullName: string };
    assignedBy: { fullName: string };
  }[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { fullName: string; role: string };
}

interface Specialist {
  id: string;
  fullName: string;
  email: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [error, setError] = useState('');

  const fetchClient = useCallback(async () => {
    try {
      const [clientData, commentsData] = await Promise.all([
        api.getClient(id),
        api.getComments(id),
      ]);
      setClient(clientData);
      setComments(commentsData);
    } catch {
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) {
      fetchClient();
      if (user.role === 'PROJECT_MANAGER') {
        api.getUsers('specialist').then(setSpecialists).catch(() => {});
      }
    }
  }, [authLoading, user, fetchClient, router]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await api.addComment(id, newComment.trim());
      setNewComment('');
      const data = await api.getComments(id);
      setComments(data);
    } catch {
      // handled
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await api.acknowledgeClient(id);
      fetchClient();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleAssign = async (specialistId: string) => {
    try {
      await api.assignClient(id, specialistId);
      setShowAssignModal(false);
      fetchClient();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка назначения');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.updateClient(id, { status });
      setShowStatusModal(false);
      fetchClient();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Архивировать клиента?')) return;
    try {
      await api.archiveClient(id);
      router.push('/clients');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Клиент не найден</div>
      </div>
    );
  }

  const isPM = user.role === 'PROJECT_MANAGER';
  const isSpecialist = user.role === 'SPECIALIST';
  const canAcknowledge =
    isSpecialist &&
    client.assignedTo?.id === user.id &&
    !client.assignmentSeen &&
    client.status === 'ASSIGNED';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/clients')}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          &larr; Назад к списку
        </button>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {client.fullName || client.companyName}
                  </h1>
                  {client.fullName && client.companyName && (
                    <p className="text-sm text-gray-500 mt-1">
                      {client.companyName}
                    </p>
                  )}
                </div>
                <StatusBadge status={client.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Телефон:</span>
                  <p className="font-medium">{client.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{client.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Источник:</span>
                  <p className="font-medium">{client.source}</p>
                </div>
                <div>
                  <span className="text-gray-500">Дата создания:</span>
                  <p className="font-medium">
                    {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Создал:</span>
                  <p className="font-medium">{client.createdBy.fullName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Специалист:</span>
                  <p className="font-medium">
                    {client.assignedTo?.fullName || 'Не назначен'}
                  </p>
                </div>
              </div>

              {client.notes && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">Заметки:</span>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t flex flex-wrap gap-3">
                {canAcknowledge && (
                  <button
                    onClick={handleAcknowledge}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Принять в работу
                  </button>
                )}

                {isPM && (
                  <>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Назначить специалиста
                    </button>
                    <button
                      onClick={() => setShowStatusModal(true)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    >
                      Изменить статус
                    </button>
                    <button
                      onClick={handleArchive}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                    >
                      Архивировать
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Комментарии
              </h2>

              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500">Комментариев пока нет</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-l-2 border-gray-200 pl-4 py-1"
                    >
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">
                          {comment.author.fullName}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                          {ROLE_LABELS[comment.author.role]}
                        </span>
                        <span>
                          {new Date(comment.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex space-x-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Напишите комментарий..."
                />
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium self-end"
                >
                  {submittingComment ? '...' : 'Отправить'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment History */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                История назначений
              </h2>
              {client.assignmentHistory.length === 0 ? (
                <p className="text-sm text-gray-500">Назначений не было</p>
              ) : (
                <div className="space-y-3">
                  {client.assignmentHistory.map((h) => (
                    <div key={h.id} className="text-sm border-b pb-3 last:border-0">
                      <p className="font-medium text-gray-700">
                        {h.specialist.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Назначил: {h.assignedBy.fullName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(h.assignedAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Назначить специалиста
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {specialists.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => handleAssign(spec.id)}
                  className={`w-full text-left px-4 py-3 border rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors ${
                    client.assignedTo?.id === spec.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{spec.fullName}</div>
                  <div className="text-xs text-gray-500">{spec.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Изменить статус
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`w-full text-left px-4 py-3 border rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm ${
                    client.status === key
                      ? 'border-blue-500 bg-blue-50 font-medium'
                      : 'border-gray-200'
                  }`}
                >
                  {label}
                  {client.status === key && (
                    <span className="ml-2 text-xs text-blue-600">
                      (текущий)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
