'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useMyApplication } from '@/lib/hooks/useQueries';
import { vendorApplicationsApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageLoader } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { Building2, Upload, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';

type FormData = {
  vendorType: 'individual' | 'business';
  businessName: string;
  businessDescription: string;
  businessRegistrationNumber: string;
  phone: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  experience: string;
  instagram: string;
  facebook: string;
  youtube: string;
  portfolioLinks: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
};

const DOCUMENTS = [
  ['aadhaar', 'Aadhaar / identity proof'],
  ['pan', 'PAN proof'],
  ['gst', 'GST certificate (if applicable)'],
  ['business_license', 'Business registration / licence (business vendors)'],
  ['address_proof', 'Address proof'],
  ['profile_photo', 'Profile photo'],
  ['shop_photo', 'Business / operating location photo'],
  ['portfolio', 'Portfolio file'],
  ['work_proof', 'Completed work photo proof'],
] as const;

export default function VendorApplicationPage() {
  const queryClient = useQueryClient();
  const { data: application, isLoading, refetch } = useMyApplication();
  const [submitting, setSubmitting] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [resubmit, setResubmit] = useState(false);
  const [documents, setDocuments] = useState<Record<string, File | null>>({});

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      vendorType: 'individual', businessName: '', businessDescription: '',
      businessRegistrationNumber: '', phone: '', website: '', gstNumber: '', panNumber: '',
      address: '', city: '', state: '', experience: '', instagram: '', facebook: '', youtube: '',
      portfolioLinks: '', accountName: '', accountNumber: '', ifscCode: '', bankName: '',
    },
  });

  const vendorType = watch('vendorType');

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Location is not supported by this browser.');
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setCoords({ latitude, longitude });
      try {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (key) {
          const response = await fetch(`https://geocode.googleapis.com/v4beta/geocode/location/${latitude},${longitude}?key=${encodeURIComponent(key)}`);
          const json: any = await response.json();
          const result = json?.results?.[0];
          const formatted = result?.formattedAddress || result?.formatted_address;
          if (formatted) setValue('address', formatted);
        }
      } catch {
        // Coordinates remain valid even if demo geocoding is unavailable.
      } finally {
        setLocationBusy(false);
      }
    }, (error) => {
      setLocationBusy(false);
      toast.error(error.message || 'Unable to access your location.');
    }, { enableHighAccuracy: true });
  };

  const uploadDocument = async (type: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    await vendorApplicationsApi.uploadDocument(formData);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (data.vendorType === 'business' && !data.businessRegistrationNumber.trim()) {
        return toast.error('Business registration number/details are required for a business vendor.');
      }
      if (!data.panNumber.trim()) return toast.error('PAN number is required.');
      if (!data.accountName.trim() || !data.accountNumber.trim() || !data.ifscCode.trim() || !data.bankName.trim()) {
        return toast.error('Complete all bank / payout details.');
      }
      if (!coords) return toast.error('Use current location before submitting so serviceability coordinates are saved.');

      setSubmitting(true);
      await vendorApplicationsApi.apply({
        vendorType: data.vendorType,
        businessName: data.businessName.trim(),
        businessDescription: data.businessDescription.trim(),
        businessRegistrationNumber: data.businessRegistrationNumber.trim() || undefined,
        categories: ['general'],
        city: data.city.trim(),
        state: data.state.trim(),
        address: data.address.trim(),
        businessPhone: data.phone.trim(),
        website: data.website || undefined,
        gstNumber: data.gstNumber || undefined,
        panNumber: data.panNumber.trim().toUpperCase(),
        experience: data.experience || undefined,
        instagram: data.instagram || undefined,
        facebook: data.facebook || undefined,
        youtube: data.youtube || undefined,
        portfolioLinks: data.portfolioLinks.split(',').map((x) => x.trim()).filter(Boolean),
        bankDetails: {
          accountName: data.accountName.trim(),
          accountNumber: data.accountNumber.trim(),
          ifscCode: data.ifscCode.trim().toUpperCase(),
          bankName: data.bankName.trim(),
        },
        serviceLocation: {
          formattedAddress: data.address.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          serviceRadiusKm: 25,
        },
      });

      for (const [type, file] of Object.entries(documents)) if (file) await uploadDocument(type, file);
      await queryClient.invalidateQueries({ queryKey: ['vendor-application'] });
      await refetch();
      setResubmit(false);
      toast.success('Vendor application submitted successfully.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <><Navbar /><div className="pt-20"><PageLoader /></div></>;

  const showForm = !application?._id || (application.status === 'rejected' && resubmit);

  return <>
    <Navbar />
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-royal-blue">Become an OMIQORA Vendor</h1>
          <p className="mt-2 text-muted">Real identity, business, bank, address, location and work-proof onboarding. Sensitive bank details are not returned by the API.</p>
        </div>

        {!showForm && application?._id ? <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-semibold">Vendor Application</h2><p className="text-sm text-muted">Submitted on {application.createdAt ? formatDate(application.createdAt) : '-'}</p></div>
            <StatusBadge status={application.status} />
          </div>
          {application.status === 'pending' && <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-6 flex gap-3"><Clock className="text-yellow-600" /><div><h3 className="font-semibold text-yellow-800">Application under review</h3><p className="text-sm text-yellow-700 mt-2">OMIQORA admins are reviewing the application and uploaded verification documents.</p></div></div>}
          {application.status === 'approved' && <div className="rounded-xl border border-green-300 bg-green-50 p-6 flex gap-3"><CheckCircle className="text-green-600" /><div><h3 className="font-semibold text-green-800">Application approved</h3><p className="text-sm text-green-700 mt-2">You can access the Vendor Dashboard and manage services.</p><a href="/dashboard/vendor" className="btn-primary inline-block mt-5">Go to Vendor Dashboard</a></div></div>}
          {application.status === 'rejected' && <div className="rounded-xl border border-red-300 bg-red-50 p-6 flex gap-3"><XCircle className="text-red-600" /><div><h3 className="font-semibold text-red-700">Resubmission required</h3><p className="text-sm text-red-600 mt-2">{application.rejectionReason || 'Your application needs changes.'}</p><button onClick={() => setResubmit(true)} className="btn-primary mt-5">Update and resubmit</button></div></div>}
          <div className="mt-6 grid md:grid-cols-2 gap-3">{application.documents?.map((doc: any) => <div key={`${doc.type}-${doc.uploadedAt}`} className="border border-border rounded-xl p-3"><p className="font-medium capitalize">{doc.type.replaceAll('_', ' ')}</p><p className="text-sm text-muted capitalize">{doc.verificationStatus}</p>{doc.rejectionReason && <p className="text-sm text-red-500">{doc.rejectionReason}</p>}</div>)}</div>
        </div> : <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="card">
            <div className="flex items-center gap-3 mb-6"><Building2 className="text-royal-blue" /><h2 className="text-xl font-semibold">Vendor identity and business information</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="label">Vendor type *</label><select {...register('vendorType')} className="input"><option value="individual">Individual</option><option value="business">Business</option></select></div>
              <div><label className="label">Business / individual name *</label><input {...register('businessName', { required: true })} className="input" />{errors.businessName && <p className="text-red-500 text-sm mt-1">Name is required.</p>}</div>
              {vendorType === 'business' && <div><label className="label">Business registration number/details *</label><input {...register('businessRegistrationNumber')} className="input" /></div>}
              <div><label className="label">Phone *</label><input {...register('phone', { required: true })} className="input" /></div>
              <div><label className="label">PAN *</label><input {...register('panNumber', { required: true })} className="input uppercase" /></div>
              <div><label className="label">GST number (if applicable)</label><input {...register('gstNumber')} className="input" /></div>
              <div className="md:col-span-2"><label className="label">Description *</label><textarea {...register('businessDescription', { required: true, minLength: 20 })} className="input min-h-28" /></div>
              <div><label className="label">Website</label><input {...register('website')} className="input" /></div>
              <div><label className="label">Experience</label><input {...register('experience')} className="input" /></div>
              <div><label className="label">Instagram</label><input {...register('instagram')} className="input" /></div>
              <div><label className="label">Facebook</label><input {...register('facebook')} className="input" /></div>
              <div><label className="label">YouTube</label><input {...register('youtube')} className="input" /></div>
              <div><label className="label">Portfolio links, comma separated</label><input {...register('portfolioLinks')} className="input" /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6"><MapPin className="text-royal-blue" /><h2 className="text-xl font-semibold">Operating address and service location</h2></div>
            <button type="button" onClick={useCurrentLocation} disabled={locationBusy} className="btn-secondary mb-5">{locationBusy ? 'Locating...' : 'Use current location'}</button>
            {coords && <p className="text-sm text-green-600 mb-4">Location coordinates captured for serviceability validation.</p>}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2"><label className="label">Full address *</label><input {...register('address', { required: true })} className="input" /></div>
              <div><label className="label">City *</label><input {...register('city', { required: true })} className="input" /></div>
              <div><label className="label">State *</label><input {...register('state', { required: true })} className="input" /></div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Bank / payout details</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div><label className="label">Account holder / business name *</label><input {...register('accountName', { required: true })} className="input" /></div>
              <div><label className="label">Account number *</label><input type="password" autoComplete="off" {...register('accountNumber', { required: true })} className="input" /></div>
              <div><label className="label">IFSC code *</label><input {...register('ifscCode', { required: true })} className="input uppercase" /></div>
              <div><label className="label">Bank name *</label><input {...register('bankName', { required: true })} className="input" /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3"><Upload className="text-royal-blue" /><h2 className="text-xl font-semibold">KYC, address and work proofs</h2></div>
            <p className="text-sm text-muted mb-5">Portfolio links are public profile material. Identity/address/work-proof files are verification documents and are reviewed separately.</p>
            <div className="grid md:grid-cols-2 gap-4">{DOCUMENTS.map(([key, label]) => <label key={key} className="border border-border rounded-xl p-4 cursor-pointer"><span className="font-medium">{label}</span><input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="block mt-3 text-sm" onChange={(e) => setDocuments((prev) => ({ ...prev, [key]: e.target.files?.[0] ?? null }))} /></label>)}</div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">{submitting ? 'Submitting...' : application?.status === 'rejected' ? 'Resubmit vendor application' : 'Submit vendor application'}</button>
        </form>}
      </div>
    </div>
  </>;
}
