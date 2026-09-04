import { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  Icon,
  useToast,
  CloseButton
} from '@chakra-ui/react';
import { FiKey, FiX } from 'react-icons/fi';
import { useAuth } from '@/core/context/AuthContext';
import webauthnService from '@/shared/services/webauthnService';
import PasskeyManager from '../auth/PasskeyManager';

const PasskeyPromoBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const [isPasskeyManagerOpen, setIsPasskeyManagerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isWebAuthnSupported } = useAuth();
  const toast = useToast();

  useEffect(() => {
    checkPasskeyStatus();
  }, [user]);

  const checkPasskeyStatus = async () => {
    if (!user || !isWebAuthnSupported) {
      setLoading(false);
      return;
    }

    try {
      // Verificar si el dispositivo puede usar passkeys (tiene biométricos)
      const canUsePasskeys = await webauthnService.canDeviceUsePasskeys();
      if (!canUsePasskeys) {
        // No mostrar banner si el dispositivo no puede usar passkeys
        setLoading(false);
        return;
      }

      const credentials = await webauthnService.getUserCredentials();
      const hasAny = credentials.length > 0;
      setHasPasskeys(hasAny);
      
      // Mostrar banner si no tiene passkeys y no se ha cerrado antes
      const bannerDismissed = localStorage.getItem(`passkey_banner_dismissed_${user.id}`);
      setShowBanner(!hasAny && !bannerDismissed);
    } catch (error) {
      console.error('Error verificando passkeys:', error);
      setShowBanner(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (user) {
      localStorage.setItem(`passkey_banner_dismissed_${user.id}`, 'true');
    }
  };

  const handleRegisterClick = () => {
    setIsPasskeyManagerOpen(true);
  };

  const handlePasskeyManagerClose = () => {
    setIsPasskeyManagerOpen(false);
    checkPasskeyStatus(); // Re-verificar después de registrar
  };

  if (loading || !showBanner || !isWebAuthnSupported) {
    return null;
  }

  return (
    <>
      <Box 
        position="fixed" 
        top={4} 
        left="50%" 
        transform="translateX(-50%)" 
        zIndex={1000} 
        w="90%" 
        maxW="600px"
        mx="auto"
      >
        <Alert
          status="info"
          borderRadius="lg"
          boxShadow="lg"
          bg="brand.50"
          border="1px solid"
          borderColor="brand.200"
        >
          <AlertIcon color="brand.500" />
          <Box flex={1}>
            <AlertTitle fontSize="md" color="brand.800" mb={1}>
              🔐 Inicia sesión más rápido y seguro
            </AlertTitle>
            <AlertDescription fontSize="sm" color="brand.700" mb={3}>
              Configura una Passkey para iniciar sesión con tu huella, Face ID o Touch ID. 
              Es más rápido que escribir contraseña y más seguro.
            </AlertDescription>
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="brand"
                leftIcon={<Icon as={FiKey} />}
                onClick={handleRegisterClick}
              >
                Configurar Passkey
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Ahora no
              </Button>
            </HStack>
          </Box>
          <CloseButton
            position="absolute"
            right={2}
            top={2}
            onClick={handleDismiss}
            color="brand.600"
          />
        </Alert>
      </Box>

      <PasskeyManager
        isOpen={isPasskeyManagerOpen}
        onClose={handlePasskeyManagerClose}
      />
    </>
  );
};

export default PasskeyPromoBanner;
