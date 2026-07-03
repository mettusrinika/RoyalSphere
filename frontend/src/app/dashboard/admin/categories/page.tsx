'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCategories } from '@/lib/hooks/useQueries';
import { categoriesApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Skeleton';
import { LayoutDashboard, Users, ShieldCheck, Store, Calendar, CreditCard, Tag, BarChart2, Plus, Edit, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={18} /> },
  { label: 'Vendor Applications', href: '/dashboard/admin/applications', icon: <ShieldCheck size={18} /> },
  { label: 'Services', href: '/dashboard/admin/services', icon: <Store size={18} /> },
  { label: 'Bookings', href: '/dashboard/admin/bookings', icon: <Calendar size={18} /> },
  { label: 'Payments', href: '/dashboard/admin/payments', icon: <CreditCard size={18} /> },
  { label: 'Categories', href: '/dashboard/admin/categories', icon: <Tag size={18} /> },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: <BarChart2 size={18} /> },
];

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const openAdd = () => { reset(); setEditing(null); setModal('add'); };
  const openEdit = (cat: any) => {
    setEditing(cat); setModal('edit');
    setValue('name', cat.name); setValue('description', cat.description); setValue('icon', cat.icon);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      if (modal === 'edit' && editing) {
        await categoriesApi.update(editing._id, data);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(data);
        toast.success('Category created');
      }
      qc.invalidateQueries({ queryKey: ['categories'] });
      setModal(null);
    } catch (error: any) {
  toast.error(
    error?.response?.data?.message || 'Operation failed'
  );
} finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Deactivate this category?')) return;
    try {
  await categoriesApi.delete(id);

  qc.invalidateQueries({
    queryKey: ['categories'],
  });

  toast.success('Category deactivated');
} catch (error: any) {
  toast.error(
    error?.response?.data?.message ||
      'Unable to delete category'
  );
}
  };

  const onSeed = async () => {
try {
  await categoriesApi.seed();

  qc.invalidateQueries({
    queryKey: ['categories'],
  });

  toast.success('Default categories seeded!');
} catch (error: any) {
  toast.error(
    error?.response?.data?.message ||
      'Unable to seed categories'
  );
}
  };

  return (
    <DashboardLayout navItems={navItems} title="Categories">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{categories?.length || 0} categories</p>
        <div className="flex gap-2">
          <button onClick={onSeed} className="btn-outline text-sm px-4 py-2 rounded-xl">Seed Defaults</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl">
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {isLoading ? <PageLoader /> : !categories?.length ? (
        <EmptyState icon="🏷️" title="No categories" description="Add categories or seed defaults to get started"
          action={{ label: 'Seed Default Categories', onClick: onSeed }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat: any) => (
            <div key={cat._id} className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-royal-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{cat.icon || '📦'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{cat.name || 'Unnamed Category'}</p>
                <p
  className="text-xs text-muted truncate"
  title={cat.description || 'No description available'}
>
  {cat.description || 'No description available'}
</p>
                <p className="text-xs text-muted mt-0.5">{cat.serviceCount ?? 0} services</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(cat)} className="p-2 text-muted hover:text-royal-blue rounded-lg hover:bg-royal-50"><Edit size={15} /></button>
                <button onClick={() => onDelete(cat._id)} className="p-2 text-muted hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-royal-blue">{modal === 'add' ? 'Add Category' : 'Edit Category'}</h3>
              <button
  type="button"
  disabled={saving}
  onClick={() => setModal(null)}
><X size={20} className="text-muted" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
  {...register('name', {
    required: 'Category name is required',
    minLength: 2,
    maxLength: 50,
  })} placeholder="e.g. Photography" className="input" />
              </div>
              <div>
                <label className="label">Icon (emoji)</label>
                <input {...register('icon')} placeholder="📦" className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea {...register('description')} rows={2} placeholder="Short description..." className="input resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="flex-1 btn-outline py-2.5 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">
                  {saving ? 'Saving...' : modal === 'add' ? 'Add Category' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
