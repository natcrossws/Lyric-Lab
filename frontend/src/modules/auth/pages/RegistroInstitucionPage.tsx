// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Box, Container, Heading, Text, VStack, Button, Input, FormControl, FormLabel,
  SimpleGrid, useToast, Select
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const RegistroInstitucionPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    institucion_nombre: '',
    nombre: '',
    email: '',
    password: '',
    plan_id: '',
    telefono: ''
  });

  useEffect(() => {
    axios.get(`${API}/subscriptions/plans`)
      .then((res) => setPlanes(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/subscriptions/register`, {
        ...form,
        plan_id: parseInt(form.plan_id, 10)
      });
      toast({
        title: 'Registro exitoso',
        description: 'Inicia sesión y completa el pago de la suscripción.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      navigate('/login');
    } catch (err) {
      toast({
        title: err?.response?.data?.message || 'Error al registrar',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" py={10}>
      <Container maxW="container.md">
        <Box bg="white" borderRadius="2xl" p={10} boxShadow="md" borderWidth="1px">
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Heading mb={2}>Registra tu institución</Heading>
              <Text color="gray.600">Crea tu cuenta admin y elige un plan para empezar.</Text>
            </Box>
            <form onSubmit={handleRegister}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel>Nombre de la institución</FormLabel>
                  <Input value={form.institucion_nombre} onChange={set('institucion_nombre')} />
                </FormControl>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} w="100%">
                  <FormControl isRequired>
                    <FormLabel>Nombre del admin</FormLabel>
                    <Input value={form.nombre} onChange={set('nombre')} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" value={form.email} onChange={set('email')} />
                  </FormControl>
                </SimpleGrid>
                <FormControl isRequired>
                  <FormLabel>Contraseña</FormLabel>
                  <Input type="password" value={form.password} onChange={set('password')} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Plan</FormLabel>
                  <Select placeholder="Selecciona un plan" value={form.plan_id} onChange={set('plan_id')}>
                    {planes.map((p) => (
                      <option key={p.id_cat_plan_suscripcion} value={p.id_cat_plan_suscripcion}>
                        {p.nombre} — ${p.precio_mensual}/mes
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button type="submit" colorScheme="blue" size="lg" w="100%" isLoading={submitting}>
                  Crear cuenta
                </Button>
                <Text fontSize="sm" textAlign="center">
                  ¿Ya tienes cuenta? <RouterLink to="/login">Inicia sesión</RouterLink>
                </Text>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default RegistroInstitucionPage;
