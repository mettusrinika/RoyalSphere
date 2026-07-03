import Link from 'next/link';
import { Category } from '@/lib/types';

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/services?category=${category._id}`}>
      <div className="card-hover text-center py-6 px-4 hover:border-royal-gold hover:border-2 transition-all">
        <div className="text-3xl mb-3">{category.icon}</div>
        <h3 className="font-semibold text-foreground text-sm">{category.name}</h3>
        {category.serviceCount > 0 && (
          <p className="text-xs text-muted mt-1">{category.serviceCount} services</p>
        )}
      </div>
    </Link>
  );
}
