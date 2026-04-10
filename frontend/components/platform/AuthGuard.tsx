'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // We stringify allowedRoles to prevent useEffect from firing infinitely due to array re-instantiation
  const allowedRolesStr = allowedRoles ? JSON.stringify(allowedRoles) : null;

  useEffect(() => {
    // Attempt to grab the local token
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user_details');
    
    if (!token || !userStr) {
      // Missing token natively denies layout render and kicks user back to login boundary
      setIsAuthenticated(false);
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const userType = user?.user_type;

      // Validate strict RBAC logic against the current requested layout
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
        console.warn(`User role [${userType}] blocked from traversing into constrained bounds. Redirecting to native terminal.`);
        switch (userType) {
          case 'platform_owner': router.replace('/platform-owner/dashboard'); break;
          case 'partner_manager': router.replace('/partner-manager/dashboard'); break;
          case 'super_admin': 
          case 'firm_owner': router.replace('/super-admin/dashboard'); break;
          case 'admin': 
          case 'firm_admin': router.replace('/firm-admin/dashboard'); break;
          case 'advocate': 
          case 'lawyer': router.replace('/advocate/dashboard'); break;
          case 'paralegal': router.replace('/paralegal/dashboard'); break;
          case 'client': router.replace('/client/dashboard'); break;
          default: router.replace('/login');
        }
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
    } catch (e) {
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router, allowedRolesStr]);

  // Render blocking state during execution
  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return null;

  return <>{children}</>;
}
