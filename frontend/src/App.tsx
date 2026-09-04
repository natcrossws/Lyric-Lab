import { Routes, Route, Navigate } from 'react-router-dom';
import RedirectHandler from '@/shared/components/pages/RedirectHandler';
import DocumentThemeColor from '@/shared/components/ui/DocumentThemeColor';
import { InstitutionProvider } from '@/core/context/InstitutionContext';

import AdminLayout from '@/modules/general/pages/AdminLayout';

import LoginPage from '@/modules/auth/pages/LoginPage';
import ChangePasswordPage from '@/modules/auth/pages/ChangePasswordPage';
import RegistroInstitucionPage from '@/modules/auth/pages/RegistroInstitucionPage';
import AceptacionDocumentosPage from '@/modules/auth/pages/AceptacionDocumentosPage';

import AdminDashboard from '@/modules/general/pages/AdminDashboard';
import GestionUsuarios from '@/modules/gestion/pages/GestionUsuarios';
import ConfiguracionUsuario from '@/modules/general/pages/ConfiguracionUsuario';
import PlanSubmodulosConfigPage from '@/modules/general/pages/PlanSubmodulosConfigPage';
import LegalDocsAdminPage from '@/modules/general/pages/LegalDocsAdminPage';
import BienvenidaSuscripcionPage from '@/modules/general/pages/BienvenidaSuscripcionPage';
import Instituciones from '@/modules/configuracion/pages/Instituciones';
import Apariencia from '@/modules/configuracion/pages/Apariencia';
import DesignSystemPage from '@/modules/configuracion/pages/DesignSystemPage';
import PagosStripePage from '@/modules/configuracion/pages/PagosStripePage';
import LegalTenantPage from '@/modules/configuracion/pages/LegalTenantPage';

import AvisoPrivacidadPublico from '@/shared/components/pages/AvisoPrivacidadPublico';

function App() {
  return (
    <InstitutionProvider>
      <DocumentThemeColor />
      <Routes>
        <Route path="/" element={<RedirectHandler />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroInstitucionPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/aviso-privacidad" element={<AvisoPrivacidadPublico />} />
        <Route path="/aceptacion-documentos" element={<AceptacionDocumentosPage />} />
        <Route path="/activar-suscripcion" element={<BienvenidaSuscripcionPage />} />

        <Route path="/configuracion" element={<ConfiguracionUsuario />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="configuracion" element={<ConfiguracionUsuario />} />
          <Route path="instituciones" element={<Instituciones />} />
          <Route path="instituciones-plataforma" element={<Instituciones />} />
          <Route path="configuracion-planes-submodulos" element={<PlanSubmodulosConfigPage />} />
          <Route path="documentos-legales" element={<LegalDocsAdminPage />} />
          <Route path="apariencia" element={<Apariencia />} />
          <Route path="design-system" element={<DesignSystemPage />} />
          <Route path="legal-sitio" element={<LegalTenantPage />} />
          <Route path="configuracion/pagos" element={<PagosStripePage />} />
          <Route path="configuracion/pagos/exito" element={<PagosStripePage />} />
          <Route path="configuracion/pagos/reauth" element={<PagosStripePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InstitutionProvider>
  );
}

export default App;
