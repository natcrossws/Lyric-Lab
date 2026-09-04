// @ts-nocheck
import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Text,
  useToast,
  Container,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  Code,
  Divider
} from '@chakra-ui/react';
import { FiKey, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import webauthnService from '@/shared/services/webauthnService';
import PasskeyManager from '@/shared/components/auth/PasskeyManager';
import { useAuth } from '@/core/context/AuthContext';

/**
 * Página de prueba para Passkeys
 * Úsala para probar todas las funcionalidades de WebAuthn
 */
const TestPasskeys = () => {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [testResults, setTestResults] = useState({});
  const toast = useToast();
  const { isWebAuthnSupported } = useAuth();

  const runTest = async (testName, testFn) => {
    try {
      setTestResults(prev => ({ ...prev, [testName]: 'running' }));
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: 'success' }));
      toast({
        title: `✅ ${testName}`,
        description: 'Prueba exitosa',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
      return result;
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: 'error' }));
      toast({
        title: `❌ ${testName}`,
        description: error.message || 'Error en la prueba',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      throw error;
    }
  };

  const testSupport = () => {
    const supported = webauthnService.isSupported();
    console.log('WebAuthn soportado:', supported);
    return supported;
  };

  const testRegister = async () => {
    const deviceName = `Dispositivo de Prueba - ${new Date().toLocaleTimeString()}`;
    const result = await webauthnService.registerPasskey(deviceName);
    console.log('Registro exitoso:', result);
    return result;
  };

  const testGetCredentials = async () => {
    const credentials = await webauthnService.getUserCredentials();
    console.log('Credenciales:', credentials);
    return credentials;
  };

  const testAuthenticate = async () => {
    // Necesitas ingresar tu email aquí
    const email = prompt('Ingresa tu email para probar la autenticación:');
    if (!email) throw new Error('Email requerido');
    
    const result = await webauthnService.authenticateWithPasskey(email);
    console.log('Autenticación exitosa:', result);
    return result;
  };

  const getTestStatus = (testName) => {
    const status = testResults[testName];
    if (status === 'success') return { icon: FiCheckCircle, color: 'green' };
    if (status === 'error') return { icon: FiXCircle, color: 'red' };
    return null;
  };

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            🧪 Página de Prueba - Passkeys
          </Heading>
          <Text color="gray.600">
            Usa esta página para probar todas las funcionalidades de autenticación con Passkeys
          </Text>
        </Box>

        {/* Estado de Soporte */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="semibold">Soporte de WebAuthn</Text>
                {isWebAuthnSupported ? (
                  <HStack color="green.500">
                    <FiCheckCircle />
                    <Text>Soportado</Text>
                  </HStack>
                ) : (
                  <HStack color="red.500">
                    <FiXCircle />
                    <Text>No soportado</Text>
                  </HStack>
                )}
              </HStack>
              
              {!isWebAuthnSupported && (
                <Alert status="warning">
                  <AlertIcon />
                  Tu navegador no soporta Passkeys. Actualiza a una versión más reciente.
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Pruebas Rápidas */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Pruebas Rápidas</Heading>
              
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  leftIcon={<FiKey />}
                  onClick={() => runTest('support', testSupport)}
                  isDisabled={testResults.support === 'running'}
                  size="sm"
                >
                  Verificar Soporte
                </Button>
                
                <Button
                  leftIcon={<FiKey />}
                  onClick={() => runTest('register', testRegister)}
                  isDisabled={!isWebAuthnSupported || testResults.register === 'running'}
                  colorScheme="blue"
                  size="sm"
                >
                  Registrar Passkey
                </Button>
                
                <Button
                  leftIcon={<FiKey />}
                  onClick={() => runTest('credentials', testGetCredentials)}
                  isDisabled={testResults.credentials === 'running'}
                  colorScheme="purple"
                  size="sm"
                >
                  Ver Credenciales
                </Button>
                
                <Button
                  leftIcon={<FiKey />}
                  onClick={() => runTest('authenticate', testAuthenticate)}
                  isDisabled={!isWebAuthnSupported || testResults.authenticate === 'running'}
                  colorScheme="green"
                  size="sm"
                >
                  Probar Autenticación
                </Button>
              </HStack>

              {/* Resultados */}
              {Object.keys(testResults).length > 0 && (
                <Box mt={4}>
                  <Divider mb={4} />
                  <Text fontWeight="semibold" mb={2}>Resultados:</Text>
                  <VStack align="stretch" spacing={2}>
                    {Object.entries(testResults).map(([test, status]) => {
                      const statusInfo = getTestStatus(test);
                      return (
                        <HStack key={test} justify="space-between">
                          <Text fontSize="sm">{test}</Text>
                          {statusInfo && (
                            <HStack color={`${statusInfo.color}.500`}>
                              <statusInfo.icon />
                              <Text fontSize="sm">
                                {status === 'success' ? '✅ Éxito' : status === 'error' ? '❌ Error' : '⏳ Ejecutando...'}
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Gestor de Passkeys */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Gestor de Passkeys</Heading>
                <Button
                  leftIcon={<FiKey />}
                  onClick={() => setIsManagerOpen(true)}
                  colorScheme="blue"
                  size="sm"
                >
                  Abrir Gestor
                </Button>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Gestiona todas tus Passkeys registradas: ver, agregar y eliminar dispositivos.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Instrucciones */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">📝 Instrucciones de Prueba</Heading>
              <VStack align="stretch" spacing={3} fontSize="sm">
                <Box>
                  <Text fontWeight="semibold" mb={1}>1. Verificar Soporte</Text>
                  <Text color="gray.600">
                    Haz clic en "Verificar Soporte" para confirmar que tu navegador soporta WebAuthn.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={1}>2. Registrar Passkey</Text>
                  <Text color="gray.600">
                    Haz clic en "Registrar Passkey". Se abrirá un diálogo para usar tu método biométrico
                    (Face ID, Touch ID, Windows Hello, etc.).
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={1}>3. Ver Credenciales</Text>
                  <Text color="gray.600">
                    Verifica que tu Passkey se haya registrado correctamente.
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={1}>4. Probar Autenticación</Text>
                  <Text color="gray.600">
                    Prueba autenticarte usando solo tu email y Passkey (sin contraseña).
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={1}>5. Gestor de Passkeys</Text>
                  <Text color="gray.600">
                    Abre el gestor para ver todas tus Passkeys, agregar nuevas o eliminar existentes.
                  </Text>
                </Box>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Información de Debug */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">🔍 Información de Debug</Heading>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>Abre la consola del navegador (F12) para ver logs detallados:</Text>
                <Code p={2} borderRadius="md" display="block" fontSize="xs">
                  {`// Verificar soporte
webauthnService.isSupported()

// Registrar Passkey
await webauthnService.registerPasskey('Mi Dispositivo')

// Obtener credenciales
await webauthnService.getUserCredentials()

// Autenticarse
await webauthnService.authenticateWithPasskey('tu-email@ejemplo.com')`}
                </Code>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      <PasskeyManager isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} />
    </Container>
  );
};

export default TestPasskeys;
