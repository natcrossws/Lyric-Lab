import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/context/AuthContext';

const RedirectHandler = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated || !user) {
            navigate('/login');
            return;
        }

        // Check for pending legal documents
        if (user.pendingLegalDocs) {
             navigate('/aceptacion-documentos', { replace: true });
             return;
        }

        if (user.requiresSubscriptionPayment) {
             navigate('/activar-suscripcion', { replace: true });
             return;
        }

        switch (user.role) {
            case 'ADMIN':
            case 'GLOBAL_ADMIN':
            case 'INSTITUTION_ADMIN':
            case 'PROFESOR':
            case 'PADRE':
            case 'ALUMNO':
                navigate('/admin', { replace: true });
                break;
            default:
                navigate('/login', { replace: true });
                break;
        }
    }, [user, isAuthenticated, loading, navigate]);

    return null; // This component doesn't render anything visible
};

export default RedirectHandler;
