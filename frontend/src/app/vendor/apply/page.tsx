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
import {
  Building2,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Shield,
} from 'lucide-react';

type FormData = {
  businessName: string;
  businessDescription: string;

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

  categories: string[];
};

const REQUIRED_DOCUMENTS = [
  {
    key: 'aadhaar',
    label: 'Aadhaar Card',
  },
  {
    key: 'pan',
    label: 'PAN Card',
  },
  {
    key: 'gst',
    label: 'GST Certificate',
  },
  {
    key: 'business',
    label: 'Business Registration',
  },
];

export default function VendorApplicationPage() {
  const queryClient = useQueryClient();

  const {
    data: application,
    isLoading,
    refetch,
  } = useMyApplication();
  console.log('Vendor Application:', application);

  const [submitting, setSubmitting] =
    useState(false);

  const [documents, setDocuments] =
    useState<Record<string, File | null>>({
      aadhaar: null,
      pan: null,
      gst: null,
      business: null,
    });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
  businessName: '',
  businessDescription: '',

  phone: '',

  website: '',
  gstNumber: '',
  panNumber: '',

  address: '',
  city: '',
  state: '',

  experience: '',

  instagram: '',
  facebook: '',
  youtube: '',

  categories: [],
},
  });

  const uploadDocument = async (
    type: string,
    file: File,
  ) => {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('type', type);

    await vendorApplicationsApi.uploadDocument(
      formData,
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);

      const payload = {
  businessName: data.businessName,
  businessDescription: data.businessDescription,

  categories: data.categories,

  city: data.city,
  state: data.state,
  address: data.address,

  businessPhone: data.phone,

  website: data.website || undefined,

  gstNumber: data.gstNumber || undefined,
  panNumber: data.panNumber || undefined,

  experience: data.experience || undefined,

  instagram: data.instagram || undefined,
  facebook: data.facebook || undefined,
  youtube: data.youtube || undefined,
};

const response =
  await vendorApplicationsApi.apply(payload);

      for (const key of Object.keys(documents)) {
        const file = documents[key];

        if (file) {
          await uploadDocument(key, file);
        }
      }

      queryClient.invalidateQueries({
        queryKey: ['vendor-application'],
      });

      await refetch();

      toast.success(
        'Vendor application submitted successfully.'
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          'Failed to submit application.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-20">
          <PageLoader />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto max-w-5xl px-4">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-royal-blue">
              Become a Royal Sphere Vendor
            </h1>

            <p className="mt-2 text-muted">
              Submit your business details and required
              verification documents. Once approved by our
              admin team, you'll gain access to the Vendor
              Dashboard and can start listing services.
            </p>
          </div>

          {application?._id ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    Vendor Application
                  </h2>

                  <p className="text-sm text-muted">
                    Submitted on{' '}
                    {application.createdAt
  ? formatDate(application.createdAt)
  : '-'}
                  </p>
                </div>

                <StatusBadge
                  status={application.status}
                />
              </div>
                            {application.status === 'pending' && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="text-yellow-600 mt-1" size={24} />

                    <div>
                      <h3 className="font-semibold text-yellow-800">
                        Application Under Review
                      </h3>

                      <p className="text-sm text-yellow-700 mt-2">
                        Your application has been submitted successfully.
                        Our admin team is reviewing your business details
                        and uploaded documents.
                      </p>

                      <p className="text-sm text-yellow-700 mt-3">
                        You will receive a notification once your
                        application has been approved or rejected.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {application.status === 'approved' && (
                <div className="rounded-xl border border-green-300 bg-green-50 p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      className="text-green-600 mt-1"
                      size={24}
                    />

                    <div>
                      <h3 className="font-semibold text-green-800">
                        Congratulations!
                      </h3>

                      <p className="text-sm text-green-700 mt-2">
                        Your vendor application has been approved.
                        You can now access the Vendor Dashboard
                        and start creating services.
                      </p>

                      <div className="mt-5">
                        <a
                          href="/dashboard/vendor"
                          className="btn-primary"
                        >
                          Go to Vendor Dashboard
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {application.status === 'rejected' && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-6">
                  <div className="flex items-start gap-3">
                    <XCircle
                      className="text-red-600 mt-1"
                      size={24}
                    />

                    <div>
                      <h3 className="font-semibold text-red-700">
                        Application Rejected
                      </h3>

                      <p className="mt-2 text-sm text-red-600">
                        {application.rejectionReason ||
                          'Your application was not approved.'}
                      </p>

                      <p className="mt-3 text-sm text-red-600">
                        Please update your business details or
                        upload the requested documents before
                        submitting again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <Building2
                    className="text-royal-blue"
                    size={24}
                  />

                  <h2 className="text-xl font-semibold">
                    Business Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>
                    <label className="label">
                      Business Name *
                    </label>

                    <input
                      {...register('businessName', {
                        required: true,
                      })}
                      className="input"
                    />

                    {errors.businessName && (
                      <p className="text-red-500 text-sm mt-1">
                        Business name is required.
                      </p>
                    )}
                  </div>

                  

                  <div>
                    <label className="label">
                      Phone Number *
                    </label>

                    <input
                      {...register('phone', {
                        required: true,
                      })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      Website
                    </label>

                    <input
                      {...register('website')}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      GST Number
                    </label>

                    <input
                      {...register('gstNumber')}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      PAN Number
                    </label>

                    <input
                      {...register('panNumber')}
                      className="input"
                    />
                  </div>
                  <div>
  <label className="label">Experience</label>

  <input
    {...register('experience')}
    className="input"
  />
</div>

<div>
  <label className="label">Instagram</label>

  <input
    {...register('instagram')}
    className="input"
  />
</div>

<div>
  <label className="label">Facebook</label>

  <input
    {...register('facebook')}
    className="input"
  />
</div>

<div>
  <label className="label">YouTube</label>

  <input
    {...register('youtube')}
    className="input"
  />
</div>

                  <div>
                    <label className="label">
                      City *
                    </label>

                    <input
                      {...register('city', {
                        required: true,
                      })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      State *
                    </label>

                    <input
                      {...register('state', {
                        required: true,
                      })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">
                      Pincode *
                    </label>

                    <input
                      {...register('address.pincode' as any, {
                        required: true,
                      })}
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">
                      Address *
                    </label>

                    <textarea
                      rows={4}
                      {...register('address', {
                        required: true,
                      })}
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">
                      Business Description *
                    </label>

                    <textarea
                      rows={5}
                      {...register('businessDescription', {
                        required: true,
                      })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
                            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <Shield
                    size={24}
                    className="text-royal-blue"
                  />

                  <div>
                    <h2 className="text-xl font-semibold">
                      Verification Documents
                    </h2>

                    <p className="text-sm text-muted">
                      Upload clear copies of the required
                      documents for admin verification.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {REQUIRED_DOCUMENTS.map((doc) => (
                    <div
                      key={doc.key}
                      className="border rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <FileText
                          size={18}
                          className="text-royal-blue"
                        />

                        <span className="font-medium">
                          {doc.label}
                        </span>
                      </div>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id={doc.key}
                        onChange={(e) =>
                          setDocuments((prev) => ({
                            ...prev,
                            [doc.key]:
                              e.target.files?.[0] ?? null,
                          }))
                        }
                      />

                      <label
                        htmlFor={doc.key}
                        className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 cursor-pointer hover:border-royal-blue transition"
                      >
                        <Upload size={18} />

                        <span className="text-sm">
                          {documents[doc.key]
                            ? documents[doc.key]!.name
                            : 'Choose File'}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-xl bg-blue-50 border border-blue-200 p-5">
                  <h3 className="font-semibold text-royal-blue mb-2">
                    Verification Process
                  </h3>

                  <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                    <li>
                      Submit your business information.
                    </li>

                    <li>
                      Upload all required documents.
                    </li>

                    <li>
                      Royal Sphere Admin reviews your
                      application.
                    </li>

                    <li>
                      You'll receive a notification once
                      approved.
                    </li>

                    <li>
                      After approval you can access the
                      Vendor Dashboard and publish
                      services.
                    </li>
                  </ul>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary px-8 py-3 disabled:opacity-50"
                  >
                    {submitting
                      ? 'Submitting Application...'
                      : 'Submit Vendor Application'}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </>
  );
}