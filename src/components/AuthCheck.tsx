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

  console.log('AuthCheck - Loading:', loading, 'User:', user?.email, 'Profile:', profile, 'RequireAdmin:', requireAdmin);

  useEffect(() => {
    if (!loading) {
      console.log('AuthCheck effect - User:', user?.email, 'Profile role:', profile?.role, 'RequireAdmin:', requireAdmin);
      if (!user) {
        console.log('No user found, redirecting to /auth');
        navigate('/auth');
      } else if (requireAdmin && profile?.role !== 'admin') {
        console.log('Admin required but user role is:', profile?.role, 'redirecting to /');
        navigate('/');
      } else {
        console.log('Authentication check passed');
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