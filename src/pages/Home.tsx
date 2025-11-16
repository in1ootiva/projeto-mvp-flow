import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Home() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, go to login
        navigate('/login', { replace: true });
      } else if (profile) {
        // Check user type and redirect accordingly
        if (profile.user_type === 'admin') {
          // Check if admin has a store
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Customer - redirect to their profile
          navigate('/perfil', { replace: true });
        }
      }
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}

