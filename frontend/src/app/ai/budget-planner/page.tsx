'use client';

import { useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EmptyState from '@/components/ui/EmptyState';
import ServiceCard from '@/components/services/ServiceCard';
import { useBudgetPlanner } from '@/lib/hooks/useQueries';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, Calculator, Lightbulb } from 'lucide-react';

export default function BudgetPlannerPage() {
  const {
  mutate: plan,
  data: plannerResponse,
  isPending,
} = useBudgetPlanner();

const result =
  (plannerResponse as any)?.data?.data ??
  (plannerResponse as any)?.data ??
  plannerResponse;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }, [result]);

  const totalAllocated = useMemo(() => {
    if (!result?.recommendations) return 0;

    
     return result.recommendations.reduce(
  (sum: number, item: any) =>
    sum + Number(item?.allocatedBudget ?? 0),
  0,
);
  }, [result]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16">

        {/* Hero */}
        <div className="bg-hero-gradient py-14 text-white text-center mb-10">
          <div className="max-w-2xl mx-auto px-4">

            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-5">
              <Sparkles
                size={14}
                className="text-royal-gold"
              />
              AI-Powered Planning
            </div>

            <h1 className="text-4xl font-bold mb-3">
              AI Budget Planner
            </h1>

            <p className="text-blue-200">
              Plan your perfect event budget in seconds.
            </p>

          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4">

          {/* Form */}

          <div className="card mb-8">

            <h2 className="font-semibold text-royal-blue mb-5 flex items-center gap-2">
              <Calculator size={18} />
              Event Details
            </h2>

            <form
              onSubmit={handleSubmit((data: any) =>
                plan({
                  ...data,
                  totalBudget: Number(data.totalBudget),
                  guestCount: Number(data.guestCount),
                })
              )}
              className="space-y-5"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Event */}

                <div>

                  <label className="label">
                    Event Type
                  </label>

                  <select
                    {...register('eventType', {
                      required: 'Please select an event type',
                    })}
                    className="input"
                  >
                    <option value="">
                      Select event
                    </option>

                    {[
                      'Wedding',
                      'Birthday',
                      'Corporate',
                      'Engagement',
                      'Anniversary',
                    ].map((event) => (
                      <option
                        key={event}
                        value={event.toLowerCase()}
                      >
                        {event}
                      </option>
                    ))}
                  </select>

                  {errors.eventType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.eventType.message as string}
                    </p>
                  )}

                </div>

                {/* Guests */}

                <div>

                  <label className="label">
                    Guest Count
                  </label>

                  <input
                    type="number"
                    placeholder="e.g. 100"
                    className="input"
                    {...register('guestCount', {
                      required: 'Guest count is required',

                      min: {
                        value: 1,
                        message:
                          'Guest count must be at least 1',
                      },

                      max: {
                        value: 10000,
                        message:
                          'Guest count seems too large',
                      },
                    })}
                  />

                  {errors.guestCount && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.guestCount.message as string}
                    </p>
                  )}

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Budget */}

                <div>

                  <label className="label">
                    Total Budget (₹)
                  </label>

                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    className="input"
                    {...register('totalBudget', {
                      required: 'Budget is required',

                      min: {
                        value: 1000,
                        message:
                          'Minimum budget is ₹1000',
                      },
                    })}
                  />

                  {errors.totalBudget && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.totalBudget.message as string}
                    </p>
                  )}

                </div>

                {/* City */}

                <div>

                  <label className="label">
                    City (optional)
                  </label>

                  <input
                    className="input"
                    placeholder="e.g. Mumbai"
                    {...register('city')}
                  />

                </div>

              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  '🤖 AI is planning your event...'
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate AI Plan
                  </>
                )}
              </button>

            </form>

          </div>

          {/* Results */}
                    {result && (
            <div
              ref={resultRef}
              className="space-y-6 animate-slide-up"
            >
              {/* Summary */}

              <div className="card bg-royal-blue text-white">
                <h2 className="text-xl font-bold mb-4">
                  Your Event Budget Plan
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">

                  <div>
                    <p className="text-blue-300 text-xs">
                      Total Budget
                    </p>

                    <p className="text-xl font-bold text-royal-gold">
                      {formatCurrency(result.totalBudget)}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-xs">
                      Guests
                    </p>

                    <p className="text-xl font-bold">
                      {result.guestCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-xs">
                      Per Person
                    </p>

                    <p className="text-xl font-bold text-royal-gold">
                      {formatCurrency(result.budgetPerPerson)}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-300 text-xs">
                      Categories
                    </p>

                    <p className="text-xl font-bold">
                      {result.recommendations?.length ?? 0}
                    </p>
                  </div>

                </div>
              </div>

              {/* Recommendations */}

              {result.recommendations?.map((rec: any) => (
                <div
                  key={rec.category}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">

                    <h3 className="font-semibold text-royal-blue capitalize">
                      {rec.category}
                    </h3>

                    <div className="text-right">
                      <p className="font-bold text-royal-blue">
                        {formatCurrency(rec.allocatedBudget)}
                      </p>

                      <p className="text-xs text-muted">
                        {rec.percentage}%
                      </p>
                    </div>

                  </div>

                  {!rec.suggestedServices?.length ? (
                    <EmptyState
                      icon="📦"
                      title="No services found"
                      description={`No ${rec.category} services match this budget.`}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {rec.suggestedServices.map((service: any) => (
                        <ServiceCard
                          key={service._id}
                          service={service}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Allocation */}

              <div className="card">
                <div className="flex justify-between items-center">

                  <div>
                    <h3 className="font-semibold text-royal-blue">
                      Total Allocated
                    </h3>

                    <p className="text-sm text-muted">
                      AI budget distribution
                    </p>
                  </div>

                  <p className="font-bold text-lg text-royal-blue">
                    {formatCurrency(totalAllocated)}
                    {' / '}
                    {formatCurrency(result.totalBudget)}
                  </p>

                </div>
              </div>

              {/* AI Tips */}

              {result.tips?.length > 0 && (
                <div className="card bg-gold-50 border-l-4 border-l-royal-gold">

                  <h3 className="font-semibold text-royal-blue mb-3 flex items-center gap-2">
                    <Lightbulb size={16} />
                    AI Tips
                  </h3>

                  <ul className="space-y-2">
                    {result.tips.map((tip: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-royal-gold">
                          •
                        </span>

                        {tip}
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-muted mt-5 text-center">
                    AI recommendations are estimates and may vary depending on
                    service availability.
                  </p>

                </div>
              )}

              {/* Generate Again */}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    window.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    })
                  }
                  className="btn-outline px-6 py-3 rounded-xl"
                >
                  Generate Another Plan
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}