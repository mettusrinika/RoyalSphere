'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useLogin } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSocketStore } from '@/lib/stores/socketStore';

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const setAuth = useAuthStore((state) => state.setAuth);
  const connect = useSocketStore((state) => state.connect);
  const [mode,setMode] = useState<'email'|'phone'>('email');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [phone,setPhone] = useState('');
  const [otp,setOtp] = useState('');
  const [otpRequested,setOtpRequested] = useState(false);
  const [phoneBusy,setPhoneBusy] = useState(false);

  const routeUser = (user:any) => {
    if (user.role === 'vendor' && !user.isVendorApproved) {
      toast.error('Your vendor application is still under review.');
      router.replace('/vendor/apply');
      return;
    }
    router.replace(user.role === 'admin' ? '/dashboard/admin' : user.role === 'vendor' ? '/dashboard/vendor' : '/dashboard/customer');
  };

  const normalizePhone = () => {
    const digits = phone.replace(/\D/g,'');
    return digits.length === 10 ? `+91${digits}` : phone.trim();
  };

  const requestOtp = async () => {
    setPhoneBusy(true);
    try {
      await authApi.requestPhoneOtp(normalizePhone());
      setOtpRequested(true);
      toast.success('OTP sent to your mobile number');
    } catch (error:any) {
      toast.error(error?.response?.data?.message || 'Unable to send OTP');
    } finally { setPhoneBusy(false); }
  };

  const verifyOtp = async () => {
    setPhoneBusy(true);
    try {
      const response = await authApi.verifyPhoneOtp(normalizePhone(),otp.trim());
      const auth = response.data.data ?? response.data;
      if (!auth?.user || !auth?.accessToken || !auth?.refreshToken) throw new Error('Invalid authentication response');
      setAuth(auth.user,auth.accessToken,auth.refreshToken);
      connect(auth.accessToken);
      toast.success(`Welcome back, ${auth.user.firstName || 'OMIQORA user'}!`);
      routeUser(auth.user);
    } catch (error:any) {
      toast.error(error?.response?.data?.message || error?.message || 'OTP verification failed');
    } finally { setPhoneBusy(false); }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-3">
            <Image src="/omiqora-icon.png" alt="OMIQORA" width={56} height={56} priority className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-blue-300 text-sm mt-1">Sign in to your OMIQORA account</p>
        </div>
        <div className="card">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button type="button" onClick={()=>setMode('email')} className={`py-3 rounded-xl ${mode==='email'?'btn-primary':'border border-border text-muted'}`}>Email</button>
            <button type="button" onClick={()=>setMode('phone')} className={`py-3 rounded-xl ${mode==='phone'?'btn-primary':'border border-border text-muted'}`}>Mobile OTP</button>
          </div>
          {mode === 'email' ? (
            <form onSubmit={(event)=>{event.preventDefault();login({email,password})}} className="space-y-5">
              <div><label className="label">Email Address</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="you@example.com" autoComplete="email" className="input" /></div>
              <div><label className="label">Password</label><div className="relative"><input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?'text':'password'} required placeholder="••••••••" autoComplete="current-password" className="input pr-11" /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
              <div className="flex items-center justify-end"><Link href="/auth/forgot-password" className="text-sm text-royal-gold hover:text-yellow-300 hover:underline">Forgot password?</Link></div>
              <button type="submit" disabled={isPending||!email||!password} className="btn-primary w-full py-3 rounded-xl disabled:opacity-50">{isPending?'Signing you in...':'Sign In'}</button>
            </form>
          ) : (
            <div className="space-y-5">
              <div><label className="label">Indian mobile number</label><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="+91 91000 00000" autoComplete="tel" className="input" /></div>
              {otpRequested?<div><label className="label">OTP</label><input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} inputMode="numeric" placeholder="Enter OTP" autoComplete="one-time-code" className="input" /></div>:null}
              <button type="button" onClick={otpRequested?verifyOtp:requestOtp} disabled={phoneBusy||!phone.trim()||(otpRequested&&!otp.trim())} className="btn-primary w-full py-3 rounded-xl disabled:opacity-50">{phoneBusy?'Please wait...':otpRequested?'Verify OTP & Sign In':'Send mobile OTP'}</button>
              {otpRequested?<button type="button" onClick={requestOtp} disabled={phoneBusy} className="w-full text-sm text-royal-blue hover:underline">Resend OTP</button>:null}
            </div>
          )}
          <div className="mt-6 border-t border-border pt-5">
  <p className="text-center text-sm text-gray-300">
    Don&apos;t have an account?{" "}
    <Link
      href="/auth/register"
      className="font-medium text-royal-gold hover:text-yellow-300 hover:underline"
    >
      Create one
    </Link>
  </p>
</div>
        </div>
      </div>
    </div>
  );
}
