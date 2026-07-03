'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Service } from '@/lib/types';
import { useAuthStore } from '@/lib/stores/authStore';
import { useToggleSaved } from '@/lib/hooks/useQueries';
import Image from "next/image";

interface Props { service: Service; compact?: boolean; }

export default function ServiceCard({ service, compact }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { mutate: toggleSaved } = useToggleSaved();
  const vendor = service.vendorId as any;
  const category = service.categoryId as any;
 const [image, setImage] = useState(
  service.images?.[0] || '/placeholder-service.jpg'
);

  return (
    <div className="card-hover group overflow-hidden p-0">
      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-2xl">
      <Image
  src={image}
  alt={service.name}
  fill
  className="object-cover group-hover:scale-105 transition-transform duration-300"
  onError={() => setImage('/placeholder-service.jpg')}
/>
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); toggleSaved(service._id); }}
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart size={14} className="text-muted" />
          </button>
        )}
        {category && (
          <span className="absolute top-3 left-3 bg-royal-blue/90 text-white text-xs px-2 py-1 rounded-full">
            {category.icon} {category.name}
          </span>
        )}
        {(service.trendingScore ?? 0) > 50 && (
          <span className="absolute bottom-3 left-3 bg-royal-gold text-royal-blue text-xs font-bold px-2 py-1 rounded-full">🔥 Trending</span>
        )}
      </div>

      <div className="p-4">
        <Link href={`/services/${service._id}`}>
          <h3 className="font-semibold text-foreground mb-1 hover:text-royal-blue transition-colors line-clamp-1">{service.name}</h3>
        </Link>
        {vendor && (
          <p className="text-xs text-muted mb-2">
           by {vendor.firstName ?? ''} {vendor.lastName ?? ''}
            {vendor.vendorProfile?.isVerified && <span className="ml-1 text-royal-gold">✓</span>}
          </p>
        )}
        {service.location?.city && (
          <div className="flex items-center gap-1 text-xs text-muted mb-3">
            <MapPin size={10} /> {service.location.city}
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-foreground">{service.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-muted">({service.reviewCount ?? 0})</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted block">Starting from</span>
            <span className="text-base font-bold text-royal-blue">{formatCurrency(service.basePrice ?? 0)}</span>
          </div>
        </div>
        <Link href={`/services/${service._id}`} className="mt-3 w-full btn-primary text-center text-sm py-2 rounded-lg block">
          View Details
        </Link>
      </div>
    </div>
  );
}
