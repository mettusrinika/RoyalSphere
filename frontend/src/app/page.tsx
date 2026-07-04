'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  useCategories,
  useFeaturedServices,
  usePublicStats,
} from '@/lib/hooks/useQueries';
import { formatCurrency } from '@/lib/utils';
import { Star, ArrowRight, Zap, Shield, Award, Users, Search, Calendar, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ServiceCard from '@/components/services/ServiceCard';
import CategoryCard from '@/components/services/CategoryCard';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: categories } = useCategories();
  const { data: featured } = useFeaturedServices(8);
  const { data: stats } = usePublicStats();


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/services?q=${encodeURIComponent(search)}`);
  };

  const homepageStats = [
  {
    label: 'Happy Customers',
    value: stats?.customers ?? 0,
    icon: Users,
  },
  {
    label: 'Verified Vendors',
    value: stats?.vendors ?? 0,
    icon: Shield,
  },
  {
    label: 'Services Listed',
    value: stats?.services ?? 0,
    icon: Award,
  },
  {
    label: 'Events Completed',
    value: stats?.completedBookings ?? 0,
    icon: Calendar,
  },
];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-hero-gradient text-white pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-royal-gold rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-gold-300 mb-6">
              <Zap size={14} className="text-royal-gold" />
              AI-Powered Services Ecosystem
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Plan Your Perfect
              <span className="block text-transparent bg-clip-text bg-gold-gradient">
                Royal Event
              </span>
            </h1>
            <p className="text-xl text-blue-200 mb-10 leading-relaxed">
              Connect with verified photographers, decorators, caterers and more.
              AI-powered matching ensures you find the perfect vendor every time.
            </p>
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search services, vendors..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-royal-gold"
                />
              </div>
              <button type="submit" className="btn-gold flex items-center gap-2 px-6 py-3.5 rounded-xl">
                Search <ArrowRight size={16} />
              </button>
            </form>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-blue-300">
              <span className="flex items-center gap-1.5">
  <CheckCircle size={14} className="text-royal-gold" /> {stats?.vendors ?? 0} Verified Vendors
</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-royal-gold" /> Secure Payments</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-royal-gold" /> 24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {/* Stats */}
<section className="bg-white border-b border-border py-12">
  <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
    {homepageStats.map(({ label, value, icon: Icon }) => (
      <div key={label} className="text-center">
        <div className="w-12 h-12 bg-royal-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Icon size={22} className="text-royal-blue" />
        </div>

        <div className="text-2xl font-bold text-royal-blue">
          {value}
        </div>

        <div className="text-sm text-muted mt-1">
          {label}
        </div>
      </div>
    ))}
  </div>
</section>

      {/* Categories */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-royal-gold font-medium text-sm mb-1 uppercase tracking-wide">Browse by Category</p>
            <h2 className="section-title">What are you looking for?</h2>
          </div>
          <Link href="/services" className="text-royal-blue font-medium flex items-center gap-1 hover:underline text-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {!categories?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat: any) => <CategoryCard key={cat._id} category={cat} />)}
          </div>
        )}
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-royal-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-royal-gold font-medium text-sm mb-1 uppercase tracking-wide">Top Picks</p>
              <h2 className="section-title">Featured Services</h2>
            </div>
            <Link href="/services?sort=trending" className="text-royal-blue font-medium flex items-center gap-1 hover:underline text-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!featured?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="h-72 skeleton rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 8).map((s: any) => <ServiceCard key={s._id} service={s} />)}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-royal-gold font-medium text-sm mb-1 uppercase tracking-wide">Simple Process</p>
          <h2 className="section-title">How OMIQORA Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Browse & Discover', desc: 'Search and compare thousands of verified service vendors using our AI-powered search.' },
            { step: '02', title: 'Book & Pay Securely', desc: 'Book your preferred vendor with secure Razorpay payments. Get instant booking confirmation.' },
            { step: '03', title: 'Enjoy & Review', desc: 'Experience world-class services and share your feedback to help others choose better.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center p-8 rounded-2xl bg-white shadow-card relative">
              <div className="text-5xl font-bold text-royal-blue/10 absolute top-4 right-6">{step}</div>
              <div className="w-14 h-14 bg-royal-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">{step}</span>
              </div>
              <h3 className="text-lg font-semibold text-royal-blue mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-royal-gradient text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to create something extraordinary?</h2>
          <p className="text-blue-200 text-lg mb-8">Join OMIQORA and discover trusted, verified service professionals.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/register" className="btn-gold px-8 py-3.5 rounded-xl text-base">
              Get Started Free
            </Link>
            <Link href="/services" className="border-2 border-white text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white hover:text-royal-blue transition-all">
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
