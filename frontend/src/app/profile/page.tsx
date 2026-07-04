'use client';
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/stores/authStore';
import { usersApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { useChangePassword } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  User,
  Camera,
  Lock,
  MapPin,
  Trash2,
  X,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deletePassword, setDeletePassword] = useState('');
const [deletingAccount, setDeletingAccount] = useState(false);
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { mutate: changePass, isPending: changingPass } = useChangePassword();

  const {
  register,
  handleSubmit,
  reset,
  formState: {
    errors,
    isDirty,
  },
} = useForm({
  defaultValues: {
    firstName: '',
    lastName: '',
    phone: '',
    'address.city': '',
    'address.state': '',
    'address.pincode': '',
  },
});
  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { errors: passErrors } } = useForm();

  useEffect(() => {
    if (user) reset({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '', 'address.city': user.address?.city || '', 'address.state': user.address?.state || '', 'address.pincode': user.address?.pincode || '' });
  }, [user]);

  const onSave = async (data: any) => {
  setSaving(true);

  try {
    const res = await usersApi.updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: {
        city: data['address.city'],
        state: data['address.state'],
        pincode: data['address.pincode'],
      },
    });

    const updatedUser =
      res.data?.data ?? res.data;

    updateUser(updatedUser);

    reset({
      firstName: updatedUser.firstName ?? '',
      lastName: updatedUser.lastName ?? '',
      phone: updatedUser.phone ?? '',
      'address.city': updatedUser.address?.city ?? '',
      'address.state': updatedUser.address?.state ?? '',
      'address.pincode': updatedUser.address?.pincode ?? '',
    });

    toast.success('Profile updated!');
  } catch (error) {
    console.error('Profile update failed:', error);
    toast.error('Failed to update profile');
  } finally {
    setSaving(false);
  }
};

const onAvatarChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Avatar must be under 5MB');
    e.target.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    toast.error('Only image files are allowed');
    e.target.value = '';
    return;
  }

  setUploadingAvatar(true);

  try {
    const fd = new FormData();
    fd.append('file', file);

    const res = await usersApi.uploadAvatar(fd);

    const avatarData =
      res.data?.data ?? res.data;

    if (!avatarData?.avatar) {
      throw new Error('Avatar URL missing');
    }

    updateUser({
      avatar: avatarData.avatar,
      profileCompletion:
        avatarData.profileCompletion ??
        user?.profileCompletion,
    });

    await qc.invalidateQueries({
      queryKey: ['profile'],
    });

    toast.success('Avatar updated!');
  } catch (error) {
    console.error('Avatar upload failed:', error);
    toast.error('Upload failed');
  } finally {
    setUploadingAvatar(false);
    e.target.value = '';
  }
};
const handleDeleteAccount = async () => {
  if (!deletePassword.trim()) {
    toast.error('Enter your password');
    return;
  }

  setDeletingAccount(true);

  try {
    await usersApi.deleteAccount(deletePassword);

    toast.success('Account deleted successfully');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    useAuthStore.getState().logout();

    setShowDeleteModal(false);

    router.replace('/');
  } catch (error: any) {
    console.error('Delete account failed:', error);

    toast.error(
      error?.response?.data?.message ||
        'Unable to delete account',
    );
  } finally {
    setDeletingAccount(false);
  }
};

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-royal-blue mb-8">My Profile</h1>

        {/* Avatar */}
        <div className="card mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-royal-blue text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
              {user?.avatar ? <img
    src={user.avatar}
    loading="lazy" className="w-full h-full object-cover" alt="" /> : getInitials(user?.firstName || '', user?.lastName || '')}
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-royal-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-gold-600 transition-colors">
              <Camera size={14} className="text-royal-blue" />
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploadingAvatar} />
            </label>
          </div>
          <div>
            <p className="font-semibold">
  {user?.firstName} {user?.lastName}
</p>

<p className="text-sm text-muted">
  {user?.email}
</p>

<p className="text-xs text-green-600 mt-1">
  ✔ Verified Email
</p>
            {user?.profileCompletion !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 w-32 bg-gray-200 rounded-full">
                  <div className="h-full bg-royal-blue rounded-full" style={{ width: `${user.profileCompletion}%` }} />
                </div>
                <span className="text-xs text-muted">{user.profileCompletion}% complete</span>
                <ul className="text-xs text-muted mt-3 space-y-1">
  {!user?.phone && <li>• Add phone number</li>}

  {!user?.address?.city && <li>• Complete address</li>}

  {!user?.avatar && <li>• Upload profile photo</li>}
</ul>
              </div>
            )}
          </div>
          {uploadingAvatar && <p className="text-xs text-royal-blue ml-auto">Uploading avatar...</p>}
        </div>

        {/* Edit profile */}
        <div className="card mb-6">
          <h2 className="font-semibold text-royal-blue mb-4 flex items-center gap-2"><User size={18} /> Personal Info</h2>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div>
  <label className="label">First Name</label>

  <input
    {...register('firstName', {
      required: 'First name is required',
      minLength: {
        value: 2,
        message: 'Minimum 2 characters',
      },
    })}
    className="input"
  />

  {errors.firstName && (
    <p className="text-red-500 text-xs mt-1">
      {errors.firstName.message as string}
    </p>
  )}
</div>
              </div>
              <div>
                <label className="label">Last Name</label>
                <input {...register('lastName', {
    required: 'Last name is required',
    minLength: {
        value: 2,
        message: 'Minimum 2 characters',
    },
})} className="input" />
{errors.lastName && (
  <p className="text-red-500 text-xs mt-1">
    {errors.lastName.message as string}
  </p>
)}
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone', {
    pattern: {
        value: /^[6-9]\d{9}$/,
        message: 'Enter a valid mobile number',
    },
})} placeholder="+91 90000 00009" className="input" />
{errors.phone && (
    <p className="text-red-500 text-xs mt-1">
        {errors.phone.message as string}
    </p>
)}
            </div>
            <div>
              <label className="label flex items-center gap-1"><MapPin size={14} /> Location</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input {...register('address.city')} placeholder="City" className="input" />
                <input {...register('address.state')} placeholder="State" className="input" />
                <input {...register('address.pincode', {
    pattern: {
        value: /^\d{6}$/,
        message: 'Invalid pincode',
    },
})} placeholder="Pincode" className="input" />
{errors['address.pincode'] && (
    <p className="text-red-500 text-xs mt-1">
        {errors['address.pincode'].message as string}
    </p>
)}
              </div>
            </div>
            <button type="submit"disabled={!isDirty || saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <h2 className="font-semibold text-royal-blue mb-4 flex items-center gap-2"><Lock size={18} /> Change Password</h2>
          <form
  onSubmit={handlePass((d: any) => {
    if (d.newPassword !== d.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    changePass(d, {
      onSuccess: () => {
        toast.success(
          'Password updated successfully. Please use your new password next time.'
        );
        resetPass();
      },
    });
  })}
  className="space-y-4"
>
  <div>
              <label className="label">Current Password</label>
              <input {...regPass('currentPassword', { required: true })} type="password" className="input" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
  {...regPass('newPassword', {
    required: 'New password is required',
    minLength: {
      value: 8,
      message: 'Minimum 8 characters',
    },
  })}
  type="password"
  className="input"
/>
{passErrors.newPassword && (
  <p className="text-red-500 text-xs mt-1">
    {passErrors.newPassword.message as string}
  </p>
)}
            </div>
<div>
  <label className="label">Confirm Password</label>

  <input
    {...regPass('confirmPassword', {
      required: 'Please confirm your password',
    })}
    type="password"
    className="input"
  />
  {passErrors.confirmPassword && (
  <p className="text-red-500 text-xs mt-1">
    {passErrors.confirmPassword.message as string}
  </p>
)}
</div>

          <button type="submit" disabled={changingPass} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
              {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          {/* Danger Zone */}
<div className="card mt-6 border border-red-200">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h2 className="font-semibold text-red-600 flex items-center gap-2">
        <Trash2 size={18} />
        Delete Account
      </h2>

      <p className="text-sm text-muted mt-2">
        Deactivate your OMIQORA account and revoke all active sessions.
        You will no longer be able to sign in using this account.
      </p>
    </div>

    {user?.role !== 'admin' && (
      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        className="flex-shrink-0 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700"
      >
        Delete Account
      </button>
    )}
  </div>

  {user?.role === 'admin' && (
    <p className="text-xs text-red-500 mt-3">
      Admin accounts cannot be deleted from the profile page.
    </p>
  )}
</div>
{showDeleteModal && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="card w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-red-600 flex items-center gap-2">
          <Trash2 size={18} />
          Delete Account
        </h3>

        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(false);
            setDeletePassword('');
          }}
          disabled={deletingAccount}
        >
          <X size={20} className="text-muted" />
        </button>
      </div>

      <p className="text-sm text-muted mb-4">
        This will deactivate your OMIQORA account and sign you out from
        all sessions. Enter your password to confirm.
      </p>

      <label className="label">
        Current Password
      </label>

      <input
        type="password"
        value={deletePassword}
        onChange={(e) => setDeletePassword(e.target.value)}
        placeholder="Enter your password"
        className="input"
        autoComplete="current-password"
      />

      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(false);
            setDeletePassword('');
          }}
          disabled={deletingAccount}
          className="flex-1 btn-outline py-2.5 rounded-xl text-sm"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deletingAccount || !deletePassword.trim()}
          className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {deletingAccount
            ? 'Deleting...'
            : 'Delete Account'}
        </button>
      </div>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
}
