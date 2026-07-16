import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>

      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>

      <p className="text-muted text-sm max-w-xs mb-6">
        {description}
      </p>

      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}