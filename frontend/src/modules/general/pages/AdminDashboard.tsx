// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  Spinner,
  Container,
  useColorModeValue
} from '@chakra-ui/react';
import { BiGroup } from 'react-icons/bi';
import { FiHome } from 'react-icons/fi';
import AdminPageShell from '@/shared/components/layout/AdminPageShell';
import api from '@/shared/services/api';

const AdminDashboard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const [loading, setLoading] = useState(true);
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/dashboard/admin');
        if (!cancelled && data?.usersCount != null) {
          setUsersCount(data.usersCount);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Box p={10} display="flex" justifyContent="center" alignItems="center" minH="40vh">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <AdminPageShell
        icon={FiHome}
        title="Panel KePlayas"
        description="Base lista para construir el nuevo producto. Gestiona usuarios, avisos y configuración desde el menú lateral."
        mb={8}
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardBody>
            <Stat>
              <StatLabel>Usuarios activos (esta institución)</StatLabel>
              <StatNumber display="flex" alignItems="center" gap={2}>
                <Box as={BiGroup} />
                {usersCount}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Container>
  );
};

export default AdminDashboard;
