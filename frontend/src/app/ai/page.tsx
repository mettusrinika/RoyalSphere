'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { aiApi } from '@/lib/api';
import { Search, Sparkles, WalletCards, Users, Gauge, MessageSquareText, TrendingUp, Activity, ShieldAlert, ScanText, BarChart3, Bot, Send, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Feature = [string, string, LucideIcon];

const groups: { title: string; items: Feature[] }[] = [
  { title: 'For Customers', items: [
    ['Smart Vendor Matching', 'Weighted discovery using category, location, budget, rating and trust signals.', Users],
    ['Personalized Recommendations', 'Recommendations shaped by customer and platform signals.', Sparkles],
    ['Budget Planning Assistant', 'Plan and optimize service budgets with intelligent recommendations.', WalletCards],
    ['Intelligent Search', 'Find relevant services using intent-aware search and ranking.', Search],
  ]},
  { title: 'For Vendors', items: [
    ['Performance Scoring', 'Scores bookings, ratings, reviews, views and conversion.', Gauge],
    ['Customer Sentiment Analysis', 'Analyses approved review feedback and sentiment signals.', MessageSquareText],
    ['Revenue Forecasting', 'Projects revenue from real paid vendor payout history.', TrendingUp],
    ['Demand Forecasting', 'Detects rising, stable or declining booking demand.', Activity],
  ]},
  { title: 'For the Platform', items: [
    ['Fraud Detection', 'Flags payment anomaly signals for admin review.', ShieldAlert],
    ['Automated Moderation', 'Screens text for abusive and spam-like patterns.', ScanText],
    ['Smart Analytics', 'Transforms live platform metrics into operational insights.', BarChart3],
    ['AI Support Assistant', 'Gemini-powered guidance with OMIQORA safety boundaries.', Bot],
  ]},
];

export default function AIAdvantagePage() {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const response = await aiApi.supportAI(message);
      setAnswer(response.data?.answer || 'No response available.');
    } catch {
      setAnswer('AI support is temporarily unavailable. Please use the relevant OMIQORA dashboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="max-w-6xl mx-auto px-4">
          <div className="royal-hero p-8 md:p-12">
            <div className="relative z-10">
              <p className="text-royal-bright font-semibold tracking-[0.22em] text-sm flex items-center gap-2"><Cpu size={17}/> OMIQORA INTELLIGENCE</p>
              <h1 className="royal-gold-text text-4xl md:text-6xl font-bold mt-3">AI Advantage</h1>
              <p className="text-muted mt-4 max-w-3xl">Smarter decisions, better experiences and greater outcomes across the OMIQORA ecosystem.</p>
              <Link href="/ai/budget-planner" className="btn-gold inline-flex mt-7 royal-shimmer">Open Budget Planner</Link>
            </div>
          </div>

          {groups.map(group => (
            <section key={group.title} className="mt-12">
              <h2 className="royal-gold-text text-2xl font-bold mb-5">{group.title}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                
  {group.items.map(([name, description, Icon]: Feature) => (
  <article key={name} className="card royal-ai-card">
    <Icon
      className="text-royal-bright mb-4 royal-icon-glow"
      size={29}
    />

    <h3 className="font-bold text-lg text-white">
      {name}
    </h3>

    <p className="text-muted text-sm mt-2 leading-6">
      {description}
    </p>
  </article>
))}

      
              </div>
            </section>
          ))}

          <section className="mt-12 royal-ai-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4"><Bot className="text-royal-bright royal-icon-glow"/><h2 className="royal-gold-text text-2xl font-bold">OMIQORA AI Support</h2></div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
  className="input flex-1 text-white placeholder:text-slate-400" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Ask about services, bookings, payments or becoming a vendor..." />
              <button className="btn-gold royal-shimmer flex items-center justify-center gap-2" onClick={ask} disabled={loading}>{loading ? 'Thinking...' : <>Ask AI <Send size={17}/></>}</button>
            </div>
            {answer && (
  <div className="mt-5 rounded-2xl border border-royal-gold/30 bg-[#000B1F] p-5 text-white leading-7 break-words whitespace-pre-wrap">
    {answer}
  </div>
)}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
