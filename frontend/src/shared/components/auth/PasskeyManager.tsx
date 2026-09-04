// @ts-nocheck
import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  IconButton,
  Input,
  FormControl,
  FormLabel,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Icon
} from '@chakra-ui/react';
import SharedModal from '@/shared/components/overlays/SharedModal';
import { FiKey, FiTrash2, FiPlus, FiCheckCircle } from 'react-icons/fi';
import webauthnService from '@/shared/services/webauthnService';

const PasskeyManager = ({ isOpen, onClose }) => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCredentials();
    }
  }, [isOpen]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const creds = await webauthnService.getUserCredentials();
      setCredentials(creds);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las Passkeys',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!webauthnService.isSupported()) {
      toast({
        title: 'No compatible',
        description: 'Tu navegador no soporta Passkeys',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    // Verificar si el dispositivo puede usar passkeys
    const canUse = await webauthnService.canDeviceUsePasskeys();
    if (!canUse) {
      toast({
        title: 'Dispositivo sin biométricos',
        description: 'Este dispositivo no tiene autenticadores biométricos disponibles (huella, Face ID, Touch ID). Las Passkeys requieren un dispositivo con estos métodos de autenticación.',
        status: 'warning',
        duration: 5000,
        isClosable: true
      });
      return;
    }

    setRegistering(true);
    try {
      await webauthnService.registerPasskey(deviceName || null);
      toast({
        title: '¡Éxito!',
        description: 'Passkey registrada correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setShowRegisterModal(false);
      setDeviceName('');
      loadCredentials();
    } catch (error) {
      let errorMessage = error.message || 'Error al registrar la Passkey';
      
      // Mensajes más específicos
      if (error.message?.includes('NotSupportedError') || error.message?.includes('not supported')) {
        errorMessage = 'Este dispositivo no soporta Passkeys. Necesitas un dispositivo con huella, Face ID, Touch ID o Windows Hello.';
      } else if (error.message?.includes('NotAllowedError') || error.message?.includes('not allowed')) {
        errorMessage = 'La operación fue cancelada o no está permitida. Asegúrate de tener habilitado Face ID, Touch ID o Windows Hello.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (credentialId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta Passkey?')) {
      return;
    }

    try {
      await webauthnService.deleteCredential(credentialId);
      toast({
        title: 'Eliminada',
        description: 'Passkey eliminada correctamente',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
      loadCredentials();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar la Passkey',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <SharedModal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        motionPreset={"scale" as any}
        title={(
          <HStack spacing={2}>
            <Icon as={FiKey} />
            <Text>Gestionar Passkeys</Text>
          </HStack>
        )}
        hideDefaultFooter
        footer={<Button onClick={onClose}>Cerrar</Button>}
      >
        {!webauthnService.isSupported() && (
          <Alert status="warning" mb={4}>
            <AlertIcon />
            Tu navegador no soporta Passkeys. Actualiza a una versión más reciente.
          </Alert>
        )}

        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">
              Administra tus métodos de autenticación biométrica
            </Text>
            {webauthnService.isSupported() && (
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                size="sm"
                onClick={() => setShowRegisterModal(true)}
              >
                Agregar Passkey
              </Button>
            )}
          </HStack>

          <Divider />

          {loading ? (
            <Center py={8}>
              <Spinner />
            </Center>
          ) : credentials.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500" mb={4}>
                No tienes Passkeys registradas
              </Text>
              <Text fontSize="sm" color="gray.400">
                Agrega una Passkey para iniciar sesión con tu huella, Face ID o Touch ID
              </Text>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {credentials.map((cred) => (
                <Box
                  key={cred.id_credential}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  _hover={{ borderColor: 'brand.300', boxShadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Icon as={FiKey} color="brand.500" />
                        <Text fontWeight="semibold">
                          {cred.device_name || 'Dispositivo sin nombre'}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        Último uso: {formatDate(cred.last_used)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Registrado: {formatDate(cred.f_reg)}
                      </Text>
                    </VStack>
                    <IconButton
                      icon={<FiTrash2 />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cred.id_credential)}
                      aria-label="Eliminar Passkey"
                    />
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </SharedModal>

      <SharedModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Registrar Nueva Passkey"
        hideDefaultFooter
        footer={(
          <>
            <Button variant="ghost" mr={3} onClick={() => setShowRegisterModal(false)}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleRegister}
              isLoading={registering}
              loadingText="Registrando..."
              leftIcon={<FiKey />}
            >
              Registrar Passkey
            </Button>
          </>
        )}
      >
        <VStack spacing={4}>
          <Alert status="info">
            <AlertIcon />
            <Text fontSize="sm">
              Se abrirá una ventana para registrar tu Passkey. Asegúrate de tener habilitado
              Face ID, Touch ID o Windows Hello.
              <br /><br />
              <strong>Importante:</strong> Si ves un código QR, <u>NO lo escanees</u>.
              Busca la opción "Este dispositivo" o verifica que tu navegador tenga permisos para usar TouchID.
            </Text>
          </Alert>
          <FormControl>
            <FormLabel>Nombre del dispositivo (opcional)</FormLabel>
            <Input
              placeholder="Ej: iPhone de Juan, Laptop Windows"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
            />
          </FormControl>
        </VStack>
      </SharedModal>
    </>
  );
};

export default PasskeyManager;
