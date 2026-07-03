import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  subtitle?: string;
  color?: 'blue' | 'gold' | 'green' | 'purple';
}

const colorMap = {
  blue: { bg: 'bg-royal-50', icon: 'bg-royal-blue text-white', text: 'text-royal-blue' },
  gold: { bg: 'bg-gold-50', icon: 'bg-royal-gold text-royal-blue', text: 'text-royal-blue' },
  green: { bg: 'bg-green-50', icon: 'bg-green-600 text-white', text: 'text-green-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-600 text-white', text: 'text-purple-700' },
};

export default function StatCard({ title, value, icon, change, subtitle, color = 'blue' }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className={cn('card', colors.bg, 'border-0')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted font-medium">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', colors.text)}>{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors.icon)}>
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 mt-3 text-xs font-medium', change >= 0 ? 'text-green-600' : 'text-red-500')}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}
