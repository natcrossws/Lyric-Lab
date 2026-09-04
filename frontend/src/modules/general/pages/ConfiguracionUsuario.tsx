// @ts-nocheck
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Button,
  useToast,
  Badge,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiKey, FiUser, FiLock, FiLayers } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import Layout from '@/shared/components/layout/Layout';
import PasskeyManager from '@/shared/components/auth/PasskeyManager';
import { useAuth } from '@/core/context/AuthContext';
import webauthnService from '@/shared/services/webauthnService';
import AdminPageShell, { AdminMainPanel } from '@/shared/components/layout/AdminPageShell';

import { adminLinks } from '@/core/config/adminLinks';
import api from '@/shared/services/api';

const mxnFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function etiquetaTipoLinea(codigo) {
  switch (codigo) {
    case 'plan_base':
      return 'Plan base';
    case 'addon_modulo':
      return 'Módulo extra';
    case 'addon_submodulo':
      return 'Pantalla extra';
    case 'addon_cuota':
      return 'Paquete consumo';
    default:
      return codigo || 'Línea';
  }
}

function descripcionLinea(l) {
  if (l.modulo?.titulo) return `Módulo: ${l.modulo.titulo}`;
  if (l.submodulo?.titulo) return `Pantalla: ${l.submodulo.titulo}`;
  if (l.paquete_consumo?.nombre) return l.paquete_consumo.nombre;
  return '—';
}

const ConfiguracionUsuario = () => {
  const location = useLocation();
  const [isPasskeyManagerOpen, setIsPasskeyManagerOpen] = useState(false);
  const [passkeyCount, setPasskeyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user, isWebAuthnSupported } = useAuth();

  const puedeVerPlanInstitucion =
    user?.role === 'ADMIN' || user?.role === 'INSTITUTION_ADMIN' || user?.role === 'GLOBAL_ADMIN';
  const [planResumen, setPlanResumen] = useState(null);
  const [planCargando, setPlanCargando] = useState(false);
  const [planError, setPlanError] = useState(null);

  useEffect(() => {
    loadPasskeyCount();
  }, []);

  useEffect(() => {
    if (!puedeVerPlanInstitucion) return undefined;
    let cancel = false;
    (async () => {
      setPlanCargando(true);
      setPlanError(null);
      try {
        const { data } = await api.get('/institucion/mi-plan');
        if (!cancel && data?.success) {
          setPlanResumen(data.data);
        } else if (!cancel) {
          setPlanError('Respuesta inválida del servidor');
        }
      } catch (e) {
        if (!cancel) {
          setPlanError(e.response?.data?.error || e.response?.data?.message || 'No se pudo cargar el plan');
        }
      } finally {
        if (!cancel) setPlanCargando(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user?.role]);

  const loadPasskeyCount = async () => {
    try {
      const credentials = await webauthnService.getUserCredentials();
      setPasskeyCount(credentials.length);
    } catch (error) {
      console.error('Error cargando Passkeys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyManagerClose = () => {
    setIsPasskeyManagerOpen(false);
    loadPasskeyCount(); // Recargar contador
  };

  // Determinar links según el tipo de usuario
  const getLinks = () => adminLinks;

  const getUserTypeLabel = () => {
    if (!user) return 'Usuario';
    switch (user.role) {
      case 'ADMIN': return 'Administrador';
      case 'GLOBAL_ADMIN': return 'Administrador global';
      case 'INSTITUTION_ADMIN': return 'Administrador de institución';
      case 'PROFESOR': return 'Profesor';
      case 'PADRE': return 'Padre/Tutor';
      case 'ALUMNO': return 'Alumno';
      default: return 'Usuario';
    }
  };

  const page = (
    <>
      <Box>
      <AdminPageShell
        icon={FiUser}
        title="Configuración de cuenta"
        description="Gestiona tu perfil, seguridad y preferencias."
        mb={4}
      />

      <Tabs colorScheme="brand" variant="soft-rounded" isFitted>
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FiUser} />
                  <Text>Perfil</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FiLock} />
                  <Text>Seguridad</Text>
                </HStack>
              </Tab>
              {puedeVerPlanInstitucion && (
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiLayers} />
                    <Text>Plan y suscripción</Text>
                  </HStack>
                </Tab>
              )}
{/* 
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FiBell} />
                  <Text>Notificaciones</Text>
                </HStack>
              </Tab>
              */}
            </TabList>

            <TabPanels>
              {/* Panel: Perfil */}
              <TabPanel px={0} py={6}>
                <AdminMainPanel>
                  <Box mb={4}>
                    <Heading size="md">Información del Perfil</Heading>
                  </Box>
                  <Box>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="semibold">Nombre</Text>
                          <Text color="gray.600">{user?.nombre || 'No disponible'}</Text>
                        </Box>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="semibold">Email</Text>
                          <Text color="gray.600">{user?.email || 'No disponible'}</Text>
                        </Box>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="semibold">Tipo de Usuario</Text>
                          <Badge colorScheme="brand" mt={1}>
                            {getUserTypeLabel()}
                          </Badge>
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                </AdminMainPanel>
              </TabPanel>

              {/* Panel: Seguridad */}
              <TabPanel px={0} py={6}>
                <VStack spacing={6} align="stretch">
                  {/* Passkeys - Destacado */}
                  <AdminMainPanel 
                    borderWidth="2px" 
                    borderColor={passkeyCount === 0 ? "brand.200" : "green.200"}
                    bgGradient={passkeyCount === 0 ? "linear(to-r, brand.50, white)" : "linear(to-r, green.50, white)"}
                  >
                    <Box mb={4}>
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Icon as={FiKey} color={passkeyCount === 0 ? "brand.600" : "green.600"} fontSize="2xl" />
                          <Box>
                            <Heading size="md" color={passkeyCount === 0 ? "brand.800" : "green.800"}>
                              🔐 Passkeys (Autenticación Biométrica)
                            </Heading>
                            <Text fontSize="sm" color={passkeyCount === 0 ? "brand.600" : "green.600"} mt={1}>
                              {passkeyCount === 0 
                                ? "Recomendado: Configura una Passkey para mayor seguridad y comodidad"
                                : "¡Excelente! Tienes autenticación biométrica configurada"}
                            </Text>
                          </Box>
                        </HStack>
                        {isWebAuthnSupported && (
                          <Badge colorScheme={passkeyCount === 0 ? "brand" : "green"} fontSize="md" px={3} py={1}>
                            {passkeyCount === 0 ? "Disponible" : "Activo"}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                    <Box>
                      <VStack spacing={4} align="stretch">
                        {!isWebAuthnSupported ? (
                          <Alert status="warning">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>Navegador no compatible</AlertTitle>
                              <AlertDescription>
                                Tu navegador no soporta Passkeys. Actualiza a una versión más reciente
                                (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+).
                              </AlertDescription>
                            </Box>
                          </Alert>
                        ) : (
                          <>
                            <Box>
                              <Text mb={3} fontSize="md" color="gray.700">
                                Las Passkeys te permiten iniciar sesión de forma segura usando tu
                                huella dactilar, Face ID, Touch ID o Windows Hello, sin necesidad
                                de contraseña. <strong>Es más rápido y más seguro.</strong>
                              </Text>
                              
                              {/* Beneficios */}
                              <VStack align="stretch" spacing={2} mt={4} mb={4}>
                                <HStack>
                                  <Text fontSize="sm" color="gray.600">✓</Text>
                                  <Text fontSize="sm" color="gray.700">Inicio de sesión instantáneo con tu huella o Face ID</Text>
                                </HStack>
                                <HStack>
                                  <Text fontSize="sm" color="gray.600">✓</Text>
                                  <Text fontSize="sm" color="gray.700">Sincronización automática entre tus dispositivos (iPhone, Mac, etc.)</Text>
                                </HStack>
                                <HStack>
                                  <Text fontSize="sm" color="gray.600">✓</Text>
                                  <Text fontSize="sm" color="gray.700">Más seguro que las contraseñas tradicionales</Text>
                                </HStack>
                                <HStack>
                                  <Text fontSize="sm" color="gray.600">✓</Text>
                                  <Text fontSize="sm" color="gray.700">Sin necesidad de recordar contraseñas</Text>
                                </HStack>
                              </VStack>

                              <HStack spacing={4} mt={4}>
                                <Box>
                                  <Text fontSize="sm" color="gray.600" mb={1}>Passkeys registradas</Text>
                                  <Text fontSize="3xl" fontWeight="bold" color={passkeyCount === 0 ? "brand.500" : "green.500"}>
                                    {loading ? '...' : passkeyCount}
                                  </Text>
                                </Box>
                              </HStack>
                            </Box>
                            <Divider />
                            <HStack spacing={3}>
                              <Button
                                leftIcon={<FiKey />}
                                colorScheme={passkeyCount === 0 ? "brand" : "green"}
                                size="lg"
                                onClick={() => setIsPasskeyManagerOpen(true)}
                                _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                              >
                                {passkeyCount === 0 ? "Configurar mi Primera Passkey" : "Gestionar Passkeys"}
                              </Button>
                              {passkeyCount > 0 && (
                                <Button
                                  variant="outline"
                                  onClick={() => window.open('/test-passkeys', '_blank')}
                                >
                                  Página de Prueba
                                </Button>
                              )}
                            </HStack>
                            {passkeyCount === 0 && (
                              <Alert status="info" mt={4} borderRadius="md">
                                <AlertIcon />
                                <Box>
                                  <AlertTitle>¡Comienza ahora!</AlertTitle>
                                  <AlertDescription>
                                    Haz clic en "Configurar mi Primera Passkey" para agregar tu primera Passkey.
                                    El proceso toma menos de 30 segundos y solo necesitas tu huella o Face ID.
                                  </AlertDescription>
                                </Box>
                              </Alert>
                            )}
                          </>
                        )}
                      </VStack>
                    </Box>
                  </AdminMainPanel>

                  {/* Contraseña */}
                  <AdminMainPanel>
                    <Box mb={4}>
                      <HStack spacing={2}>
                        <Icon as={FiLock} color="brand.500" />
                        <Heading size="md">Contraseña</Heading>
                      </HStack>
                    </Box>
                    <Box>
                      <VStack spacing={4} align="stretch">
                        <Text color="gray.600">
                          Cambia tu contraseña para mantener tu cuenta segura. Se recomienda usar
                          una contraseña fuerte y única.
                        </Text>
                        <Button colorScheme="brand" variant="outline" size="sm" w="fit-content">
                          Cambiar Contraseña
                        </Button>
                      </VStack>
                    </Box>
                  </AdminMainPanel>
                </VStack>
              </TabPanel>

              {puedeVerPlanInstitucion && (
                <TabPanel px={0} py={6}>
                  <AdminMainPanel>
                    <Box mb={4}>
                      <Heading size="md">Plan de la institución</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        Catálogo asignado a tu escuela y, si existe, el detalle de la suscripción vigente en facturación.
                      </Text>
                    </Box>
                    <Box>
                      {planCargando && (
                        <HStack py={6} justify="center">
                          <Spinner color="brand.500" />
                          <Text fontSize="sm" color="gray.600">Cargando…</Text>
                        </HStack>
                      )}
                      {!planCargando && planError && (
                        <Alert status="warning" borderRadius="md" fontSize="sm">
                          <AlertIcon />
                          {planError}
                        </Alert>
                      )}
                      {!planCargando && !planError && planResumen && (
                        <VStack align="stretch" spacing={5}>
                          <Text fontSize="sm" color="gray.600">
                            Institución:{' '}
                            <Text as="span" fontWeight="semibold" color="gray.800">
                              {planResumen.institucion?.nombre || '—'}
                            </Text>
                            {planResumen.institucion?.slug ? (
                              <Text as="span" ml={2} color="gray.500">({planResumen.institucion.slug})</Text>
                            ) : null}
                          </Text>

                          {planResumen.planAsignado ? (
                            <Box>
                              <Text fontWeight="semibold" color="brand.800" mb={2}>
                                Plan en catálogo
                              </Text>
                              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} fontSize="sm">
                                <Box bg="brand.50" borderRadius="md" p={3}>
                                  <Text color="gray.500" fontSize="xs">Nombre</Text>
                                  <Text fontWeight="bold">{planResumen.planAsignado.nombre}</Text>
                                </Box>
                                <Box bg="brand.50" borderRadius="md" p={3}>
                                  <Text color="gray.500" fontSize="xs">Precio de lista (mensual)</Text>
                                  <Text fontWeight="bold">
                                    {planResumen.planAsignado.precio_mensual != null
                                      ? mxnFmt.format(planResumen.planAsignado.precio_mensual)
                                      : '—'}
                                  </Text>
                                </Box>
                                <Box bg="gray.50" borderRadius="md" p={3}>
                                  <Text color="gray.500" fontSize="xs">Horas IA</Text>
                                  <Text fontWeight="medium">{planResumen.planAsignado.limite_horas_ia ?? '—'}</Text>
                                </Box>
                                <Box bg="gray.50" borderRadius="md" p={3}>
                                  <Text color="gray.500" fontSize="xs">Almacenamiento (GB)</Text>
                                  <Text fontWeight="medium">{planResumen.planAsignado.limite_storage_gb ?? '—'}</Text>
                                </Box>
                                <Box bg="gray.50" borderRadius="md" p={3}>
                                  <Text color="gray.500" fontSize="xs">Usuarios</Text>
                                  <Text fontWeight="medium">
                                    {planResumen.planAsignado.limite_users === 0
                                      ? 'Ilimitados'
                                      : (planResumen.planAsignado.limite_users ?? '—')}
                                  </Text>
                                </Box>
                              </SimpleGrid>
                            </Box>
                          ) : (
                            <Alert status="info" borderRadius="md" fontSize="sm">
                              <AlertIcon />
                              No hay plan de suscripción asignado a esta institución en catálogo.
                            </Alert>
                          )}

                          <Divider />

                          {planResumen.suscripcionActiva ? (
                            <Box>
                              <Text fontWeight="semibold" color="gray.800" mb={2}>
                                Suscripción vigente
                              </Text>
                              <Wrap spacing={2} mb={3} fontSize="xs">
                                {planResumen.suscripcionActiva.intervalo && (
                                  <WrapItem>
                                    <Badge colorScheme="brand">
                                      Intervalo: {planResumen.suscripcionActiva.intervalo.nombre}
                                    </Badge>
                                  </WrapItem>
                                )}
                                {planResumen.suscripcionActiva.fecha_inicio && (
                                  <WrapItem>
                                    <Badge variant="outline">
                                      Inicio: {new Date(planResumen.suscripcionActiva.fecha_inicio).toLocaleDateString('es-MX')}
                                    </Badge>
                                  </WrapItem>
                                )}
                              </Wrap>
                              {planResumen.suscripcionActiva.precio_total_mensual_snapshot != null && (
                                <Text fontSize="sm" color="gray.600" mb={3}>
                                  Monto referencia (último checkout):{' '}
                                  <Text as="span" fontWeight="semibold">
                                    {mxnFmt.format(planResumen.suscripcionActiva.precio_total_mensual_snapshot)}
                                  </Text>
                                </Text>
                              )}
                              {planResumen.suscripcionActiva.lineas?.length > 0 ? (
                                <Box overflowX="auto">
                                  <Table size="sm" variant="simple">
                                    <Thead>
                                      <Tr>
                                        <Th>Tipo</Th>
                                        <Th>Concepto</Th>
                                        <Th isNumeric>Precio línea (MXN/mes)</Th>
                                      </Tr>
                                    </Thead>
                                    <Tbody>
                                      {planResumen.suscripcionActiva.lineas.map((l, idx) => (
                                        <Tr key={idx}>
                                          <Td>
                                            <Badge fontSize="0.65em" colorScheme="cyan">
                                              {etiquetaTipoLinea(l.tipo_codigo)}
                                            </Badge>
                                          </Td>
                                          <Td fontSize="sm">{descripcionLinea(l)}</Td>
                                          <Td isNumeric fontSize="sm">
                                            {l.precio_linea_mensual != null
                                              ? mxnFmt.format(l.precio_linea_mensual)
                                              : '—'}
                                          </Td>
                                        </Tr>
                                      ))}
                                    </Tbody>
                                  </Table>
                                </Box>
                              ) : (
                                <Text fontSize="sm" color="gray.500">Sin líneas de detalle aún.</Text>
                              )}
                            </Box>
                          ) : (
                            <Alert status="info" borderRadius="md" fontSize="sm">
                              <AlertIcon />
                              No hay suscripción con estatus &quot;vigente&quot; registrada (p. ej. antes del primer pago sincronizado o tras migración).
                            </Alert>
                          )}
                        </VStack>
                      )}
                    </Box>
                  </AdminMainPanel>
                </TabPanel>
              )}

              {/* Panel: Notificaciones - OCULTO
              <TabPanel px={0} py={6}>
                <Card>
                  <CardHeader>
                    <HStack spacing={2}>
                      <Icon as={FiBell} color="brand.500" />
                      <Heading size="md">Preferencias de Notificaciones</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Text color="gray.600">
                        Configura cómo y cuándo recibes notificaciones del sistema.
                      </Text>
                      <Alert status="info">
                        <AlertIcon />
                        <Text fontSize="sm">
                          Las preferencias de notificaciones estarán disponibles próximamente.
                        </Text>
                      </Alert>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
              */}
            </TabPanels>
          </Tabs>
      </Box>

      <PasskeyManager
        isOpen={isPasskeyManagerOpen}
        onClose={handlePasskeyManagerClose}
      />
    </>
  );

  if (location.pathname === '/configuracion') {
    return (
      <Layout
        links={getLinks()}
        userType={user?.role === 'INSTITUTION_ADMIN' ? 'INSTITUTION_ADMIN' : getUserTypeLabel()}
      >
        {page}
      </Layout>
    );
  }

  return page;
};

export default ConfiguracionUsuario;
