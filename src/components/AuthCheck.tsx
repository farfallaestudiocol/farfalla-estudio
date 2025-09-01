import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const AuthCheck = ({ children, requireAdmin = false }: AuthCheckProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  console.log('AuthCheck - User:', user?.email);
  console.log('AuthCheck - Profile:', profile);
  console.log('AuthCheck - Loading:', loading);
  console.log('AuthCheck - RequireAdmin:', requireAdmin);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('AuthCheck - Redirecting to /auth - no user');
        navigate('/auth');
      } else if (requireAdmin && profile?.role !== 'admin') {
        console.log('AuthCheck - Redirecting to / - not admin. Profile role:', profile?.role);
        navigate('/');
      }
    }
  }, [user, profile, loading, navigate, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center farfalla-hero-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && profile?.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
};