import { getStatusColor, getStatusLabel } from '@/lib/utils';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${getStatusColor(
        status
      )} inline-flex items-center justify-center whitespace-nowrap`}
    >
      {getStatusLabel(status)}
    </span>
  );
}