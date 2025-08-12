'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardRouter() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!userProfile) {
      router.replace('/auth/login');
      return;
    }
    // Redirect based on user type
    if (userProfile.type === 'student') {
      router.replace('/dashboard/student');
    } else if (userProfile.type === 'tutor') {
      router.replace('/dashboard/tutor');
    } else {
      // Default fallback
      router.replace('/');
    }
  }, [userProfile, loading, router]);

  return null;
}
