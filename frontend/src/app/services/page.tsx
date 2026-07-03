'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ServiceCard from '@/components/services/ServiceCard';
import CategoryCard from '@/components/services/CategoryCard';
import { useServices, useCategories } from '@/lib/hooks/useQueries';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Search, SlidersHorizontal, X } from 'lucide-react';

function ServicesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'relevance',
    page: 1,
    limit: 12,
  });

  const [showFilters, setShowFilters] = useState(false);
  const {
  data: servicesData,
  isLoading,
} = useServices(filters);

const data = servicesData as {
  services: any[];
  total: number;
  page: number;
  totalPages: number;
} | undefined;
  const { data: categories } = useCategories();

  const updateFilter = (key: string, value: any) => setFilters(f => ({ ...f, [key]: value, page: 1 }));

  const clearFilters = () => setFilters({ q: '', category: '', city: '', minPrice: '', maxPrice: '', rating: '', sort: 'relevance', page: 1, limit: 12 });

  const hasFilters = filters.category || filters.city || filters.minPrice || filters.maxPrice || filters.rating;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Search header */}
        <div className="bg-royal-blue py-10">
          <div className="max-w-5xl mx-auto px-4">
            <h1 className="text-white text-3xl font-bold mb-6">Find Services</h1>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  value={filters.q}
                  onChange={e => updateFilter('q', e.target.value)}
                  placeholder="Search photographers, caterers, decorators..."
                  className="input pl-11"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${hasFilters ? 'bg-royal-gold border-royal-gold text-royal-blue' : 'border-white/30 text-white hover:border-white'}`}
              >
                <SlidersHorizontal size={16} />
                Filters {hasFilters ? '●' : ''}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mt-6">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button
              onClick={() => updateFilter('category', '')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!filters.category ? 'bg-royal-blue text-white' : 'bg-white border border-border text-muted hover:border-royal-blue'}`}
            >
              All
            </button>
            {categories?.map((cat: any) => (
              <button
                key={cat._id}
                onClick={() => updateFilter('category', filters.category === cat._id ? '' : cat._id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filters.category === cat._id ? 'bg-royal-blue text-white' : 'bg-white border border-border text-foreground hover:border-royal-blue'}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="card mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">City</label>
                <input value={filters.city} onChange={e => updateFilter('city', e.target.value)} placeholder="e.g. Mumbai" className="input" />
              </div>
              <div>
                <label className="label">Min Price (₹)</label>
                <input type="number" value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)} placeholder="0" className="input" />
              </div>
              <div>
                <label className="label">Max Price (₹)</label>
                <input type="number" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)} placeholder="Any" className="input" />
              </div>
              <div>
                <label className="label">Min Rating</label>
                <select value={filters.rating} onChange={e => updateFilter('rating', e.target.value)} className="input">
                  <option value="">Any</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
              <button onClick={clearFilters} className="col-span-full text-sm text-red-500 hover:underline flex items-center gap-1">
                <X size={14} /> Clear all filters
              </button>
            </div>
          )}

          {/* Sort + results count */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted">
              {isLoading ? 'Loading...' : `${data?.total ?? 0} services found`}
            </p>
            <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="input w-auto text-sm py-1.5 px-3">
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <ServiceCardSkeleton key={i} />)}
            </div>
          ) : !data?.services?.length ? (
            <EmptyState
              icon="🔍"
              title="No services found"
              description="Try adjusting your search or filters"
              action={{ label: 'Clear Filters', onClick: clearFilters }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.services.map((s: any) => <ServiceCard key={s._id} service={s} />)}
              </div>
              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {[...Array(data.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${filters.page === i + 1 ? 'bg-royal-blue text-white' : 'bg-white border border-border text-foreground hover:border-royal-blue'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-royal-blue">Loading services...</p>
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}

