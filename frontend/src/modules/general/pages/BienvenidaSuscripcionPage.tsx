// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack, Spinner, useToast, Badge, List, ListItem, HStack
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/shared/services/api';
import { useAuth } from '@/core/context/AuthContext';
import { setUserData, getUserData } from '@/shared/utils/storage';

const BienvenidaSuscripcionPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const auth = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const sessionId = params.get('session_id');
        if (sessionId) {
          await api.post('/institucion/pagos-suscripcion/confirmar-sesion', { session_id: sessionId });
          toast({ title: 'Suscripción activada', status: 'success' });
          const u = getUserData();
          if (u) setUserData({ ...u, requiresSubscriptionPayment: false, pagadoAlCorriente: true });
          navigate('/admin', { replace: true });
          return;
        }
        if (params.get('mock') === 'true') {
          toast({ title: 'Pago simulado (dev)', status: 'success' });
          navigate('/admin', { replace: true });
          return;
        }
        const res = await api.get('/institucion/pagos-suscripcion/onboarding');
        setData(res.data.data);
      } catch {
        toast({ title: 'Error al cargar onboarding', status: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pagar = async () => {
    setPaying(true);
    try {
      const res = await api.post('/institucion/pagos-suscripcion/checkout', { interval: 'month' });
      if (res.data.url) window.location.href = res.data.url;
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Error al iniciar pago', status: 'error' });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  const plan = data?.plan;

  return (
    <Box minH="100vh" bg="gray.50" py={16}>
      <Container maxW="lg">
        <VStack spacing={6} align="stretch" bg="white" p={8} borderRadius="xl" shadow="md">
          <Heading size="lg">Activa tu suscripción</Heading>
          <Text color="gray.600">
            {data?.institucion?.nombre || 'Tu institución'} necesita completar el pago del plan para acceder al panel.
          </Text>
          {plan && (
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <HStack justify="space-between" mb={2}>
                <Heading size="md">{plan.nombre}</Heading>
                <Badge colorScheme="blue">${plan.precio_mensual} MXN/mes</Badge>
              </HStack>
              <List spacing={1} fontSize="sm" color="gray.600">
                <ListItem>Usuarios: {plan.limite_users || 'Ilimitado'}</ListItem>
                <ListItem>Storage: {plan.limite_storage_gb || 0} GB</ListItem>
              </List>
            </Box>
          )}
          <Button colorScheme="blue" size="lg" onClick={pagar} isLoading={paying} isDisabled={!data?.puedePagar && data?.pagadoAlCorriente}>
            {data?.pagadoAlCorriente ? 'Ya estás al corriente' : 'Pagar con Stripe'}
          </Button>
          {data?.pagadoAlCorriente && (
            <Button variant="ghost" onClick={() => navigate('/admin')}>Ir al panel</Button>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default BienvenidaSuscripcionPage;
