// @ts-nocheck
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Layout from '@/shared/components/layout/Layout';
import { adminLinks } from '@/core/config/adminLinks';
import { useAuth } from '@/core/context/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user?.pendingLegalDocs) {
    return <Navigate to="/aceptacion-documentos" replace />;
  }
  if (user?.requiresSubscriptionPayment && !location.pathname.includes('activar-suscripcion')) {
    return <Navigate to="/activar-suscripcion" replace />;
  }

  const userType =
    user?.role === 'GLOBAL_ADMIN'
      ? 'Administrador global'
      : user?.role === 'INSTITUTION_ADMIN'
        ? 'INSTITUTION_ADMIN'
        : 'Administrador';

  return (
    <Layout links={adminLinks} userType={userType}>
      <Outlet />
    </Layout>
  );
};

export default AdminLayout;
