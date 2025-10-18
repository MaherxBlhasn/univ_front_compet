import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

/**
 * Hook personnalisé pour gérer la redirection quand il n'y a plus de session
 * Redirige vers /sessions si:
 * 1. Il n'y a aucune session disponible
 * 2. L'utilisateur n'est pas déjà sur une page autorisée sans session
 */
export const useSessionRedirect = () => {
  const { sessions, currentSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Pages autorisées sans session
    const allowedPathsWithoutSession = ['/sessions', '/teachers'];
    
    // Vérifier si on est déjà sur une page autorisée
    const isOnAllowedPath = allowedPathsWithoutSession.some(
      path => location.pathname.startsWith(path)
    );

    // Si pas de sessions et pas sur une page autorisée, rediriger
    if (sessions.length === 0 && !isOnAllowedPath) {
      console.log('⚠️ Aucune session disponible - Redirection vers /sessions');
      navigate('/sessions', { replace: true });
    }
  }, [sessions, location.pathname, navigate]);
};

export default useSessionRedirect;
