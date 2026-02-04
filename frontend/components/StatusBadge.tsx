import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
