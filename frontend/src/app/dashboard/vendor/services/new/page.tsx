'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCreateService, useUpdateService, useCategories, useService } from '@/lib/hooks/useQueries';
import { servicesApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { LayoutDashboard, Package, Calendar, CreditCard, Star, Bell, User, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/vendor', icon: <LayoutDashboard size={18} /> },
  { label: 'My Services', href: '/dashboard/vendor/services', icon: <Package size={18} /> },
  { label: 'Bookings', href: '/dashboard/vendor/bookings', icon: <Calendar size={18} /> },
  { label: 'Earnings', href: '/dashboard/vendor/earnings', icon: <CreditCard size={18} /> },
  { label: 'Reviews', href: '/dashboard/vendor/reviews', icon: <Star size={18} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function ServiceFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params?.id && params.id !== 'new';
  const { data: existing } = useService(isEdit ? params.id as string : '');
const { data: categories } = useCategories();
  const { mutate: create, isPending: creating } = useCreateService();
  const { mutate: update, isPending: updating } = useUpdateService();
  const [uploading, setUploading] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(isEdit ? params.id as string : null);

  const {
  register,
  handleSubmit,
  reset,
  setValue,
  formState: { errors },
} = useForm();

  useEffect(() => {
  if (!existing) return;

  setValue('name', existing.name);
  setValue(
    'categoryId',
    existing.categoryId?._id || existing.categoryId,
  );
  setValue(
    'description',
    existing.description,
  );
  setValue(
    'basePrice',
    existing.basePrice,
  );
  setValue(
    'priceType',
    existing.priceType,
  );
  setValue(
    'tags',
    existing.tags?.join(', ') || '',
  );
  setValue(
    'city',
    existing.location?.city || '',
  );
  setValue(
    'state',
    existing.location?.state || '',
  );
  setValue(
    'serviceRadius',
    existing.location?.serviceRadius || 50,
  );
}, [existing, setValue]);



  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      basePrice: +data.basePrice,
      location: { city: data.city, state: data.state, serviceRadius: +data.serviceRadius || 50 },
      tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    };
    if (isEdit) {
      update({ id: params.id as string, data: payload }, { onSuccess: () => router.push('/dashboard/vendor/services') });
    } else {
      create(payload, { onSuccess: (res) => { setServiceId(res.data._id); toast.success('Service created! Add images below.'); } });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!serviceId || !e.target.files?.length) return;
    setUploading(true);
    const fd = new FormData();
    const files = Array.from(e.target.files);

if (files.length > 6) {
  toast.error('Maximum 6 images allowed');
  return;
}

for (const file of files) {
  if (file.size > 5 * 1024 * 1024) {
    toast.error(`${file.name} exceeds 5MB`);
    return;
  }

  fd.append('files', file);
}
    try {
       await servicesApi.uploadImages(serviceId, fd);

toast.success('Service created successfully!');

router.refresh();
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const isPending = creating || updating;

  return (
    <DashboardLayout navItems={navItems} title={isEdit ? 'Edit Service' : 'Add New Service'}>
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card space-y-5">
            <h3 className="font-semibold text-royal-blue">Basic Information</h3>
            <div>
              <label className="label">Service Name *</label>
                <input
  {...register('name', {
    required: 'Service name is required',
    minLength: {
      value: 3,
      message: 'Minimum 3 characters',
    },
  })}
  placeholder="e.g. Professional Wedding Photography"
  className="input"
/>    
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
            </div>
            <div>
              <label className="label">Category *</label>
              <select {...register('categoryId', { required: 'Category required' })} className="input">
                <option value="">Select category</option>
                {categories?.map((c: any) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea
  {...register('description', {
    required: 'Description is required',
    minLength: {
      value: 30,
      message: 'Description should be at least 30 characters',
    },
  })}
  rows={4}
  placeholder="Describe your service in detail..."
  className="input resize-none"
/>

{errors.description && (
  <p className="text-red-500 text-xs mt-1">
    {errors.description.message as string}
  </p>
)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Base Price (₹) *</label>
              <input
  {...register('basePrice', {
    required: 'Price is required',
    min: {
      value: 1,
      message: 'Price must be greater than 0',
    },
  })}
  type="number"
  placeholder="5000"
  className="input"
/>                
              </div>
              <div>
                <label className="label">Price Type</label>
                <select {...register('priceType')} className="input">
                  <option value="fixed">Fixed</option>
                  <option value="per_hour">Per Hour</option>
                  <option value="per_day">Per Day</option>
                  <option value="per_event">Per Event</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input {...register('tags')} placeholder="wedding, portrait, outdoor" className="input" />
            </div>
          </div>

          <div className="card space-y-5">
            <h3 className="font-semibold text-royal-blue">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City *</label>
                <input {...register('city', { required: true })} placeholder="Mumbai" className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <input {...register('state')} placeholder="Maharashtra" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Service Radius (km)</label>
              <input {...register('serviceRadius')} type="number" placeholder="50" className="input" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push('/dashboard/vendor/services')} className="btn-outline px-6 py-2.5 rounded-xl">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary px-6 py-2.5 rounded-xl">
              {isPending ? 'Saving...' : isEdit ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>

        {/* Image upload section */}
          {serviceId && (
  <div className="card mt-6">
    <h3 className="font-semibold text-royal-blue mb-4">
      Service Images
    </h3>

    {isEdit && existing?.images?.length > 0 && (
      <>
        <h4 className="font-medium mb-3">
          Current Images
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          {existing.images.map((image: string, index: number) => (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden border border-border"
            >
              <img
                src={image}
                alt={`Service ${index + 1}`}
                className="w-full h-32 object-cover"
              />

              <button
  type="button"
  onClick={async () => {
  try {
    await servicesApi.deleteImage(serviceId!, index);

    toast.success("Image deleted");

    if (existing) {
      await servicesApi.deleteImage(serviceId!, index);

toast.success("Image deleted");

// Reload the latest service from the backend
router.refresh();
    }
  } catch (error: any) {
    console.error(error);

    toast.error(
      error?.response?.data?.message || "Unable to delete image",
    );
  }
}}
  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700"
>
  <X size={14} />
</button>
            </div>
          ))}
        </div>
      </>
    )}

    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-royal-blue transition-colors">
      <Upload size={24} className="text-muted mb-2" />

      <p className="text-sm text-muted">
        {uploading ? 'Uploading...' : 'Click to upload images'} (max 6)
      </p>

      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        disabled={uploading || isPending}
      />
    </label>

    {uploading && (
      <p className="text-sm text-royal-blue mt-2 text-center">
        Uploading...
      </p>
    )}

    <p className="text-xs text-muted mt-2">
      Upload up to 6 JPG, PNG or WebP images.
    </p>
  </div>
)}

      </div>
    </DashboardLayout>
  );
}