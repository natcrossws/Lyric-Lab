// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Button, VStack, Badge, useToast, Spinner, HStack
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/shared/services/api';
import AdminPageShell, { AdminMainPanel } from '@/shared/components/layout/AdminPageShell';

const PagosStripePage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const load = async () => {
    const res = await api.get('/finanzas/stripe/status');
    setStatus(res.data);
  };

  useEffect(() => {
    (async () => {
      try {
        if (location.pathname.endsWith('/exito') || location.pathname.endsWith('/reauth')) {
          await api.post('/finanzas/stripe/sync');
        }
        await load();
      } catch (e) {
        toast({ title: e?.response?.data?.message || 'Error Stripe Connect', status: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [location.pathname]);

  const conectar = async () => {
    try {
      const res = await api.get('/finanzas/stripe/onboarding');
      if (res.data.url) window.location.href = res.data.url;
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'No se pudo iniciar onboarding', status: 'error' });
    }
  };

  return (
    <AdminPageShell title="Pagos Stripe" subtitle="Conecta la cuenta Stripe de tu institución (Connect)">
      <AdminMainPanel>
        {loading ? <Spinner /> : (
          <VStack align="stretch" spacing={4} maxW="lg">
            <HStack>
              <Text>Estado:</Text>
              <Badge colorScheme={status?.connected ? 'green' : 'orange'}>
                {status?.connected ? 'Conectado' : 'Pendiente'}
              </Badge>
            </HStack>
            {status?.stripeAccountId && (
              <Text fontSize="sm" color="gray.600">Cuenta: {status.stripeAccountId}</Text>
            )}
            <Box fontSize="sm" color="gray.600">
              <Text>Cobros habilitados: {String(status?.chargesEnabled)}</Text>
              <Text>Detalles enviados: {String(status?.detailsSubmitted)}</Text>
              <Text>Payouts: {String(status?.payoutsEnabled)}</Text>
            </Box>
            <Button colorScheme="blue" onClick={conectar} alignSelf="flex-start">
              {status?.connected ? 'Actualizar conexión' : 'Conectar con Stripe'}
            </Button>
            {(location.pathname.endsWith('/exito') || location.pathname.endsWith('/reauth')) && (
              <Button variant="ghost" onClick={() => navigate('/admin/configuracion/pagos')}>Volver</Button>
            )}
          </VStack>
        )}
      </AdminMainPanel>
    </AdminPageShell>
  );
};

export default PagosStripePage;
