import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Protege rutas. Es una comodidad de interfaz: la seguridad real la dan las
 * políticas RLS de la base de datos, que se aplican igual aunque esta pantalla se evada.
 */
export const AuthCheck = ({ children, requireAdmin = false }: AuthCheckProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const notAllowed = !loading && (!user || (requireAdmin && profile?.role !== 'admin'));

  useEffect(() => {
    if (!notAllowed) return;
    navigate(user ? '/' : '/auth', { replace: true });
  }, [notAllowed, user, navigate]);

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

  if (notAllowed) return null;

  return <>{children}</>;
};
