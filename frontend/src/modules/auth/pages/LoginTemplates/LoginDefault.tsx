// @ts-nocheck
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  FormControl,
  Input,
  Button,
  VStack,
  Text,
  Image,
  useToast,
  InputGroup,
  InputLeftElement,
  Icon,
  Checkbox,
  Link,
  HStack,
  Container,
  Fade
} from '@chakra-ui/react';
import { FiUser, FiLock, FiArrowRight, FiKey, FiArrowLeft, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '@/core/context/AuthContext';
import { useInstitution } from '@/core/context/InstitutionContext';
import { getStorageItem } from '@/shared/utils/storage';
import webauthnService from '@/shared/services/webauthnService';
import AnimatedBackground from '@/shared/components/layout/AnimatedBackground';
import LoginPageNavbar, { LOGIN_TOPBAR_BLOCK_SIZE } from '@/shared/components/layout/LoginPageNavbar';

const LoginDefault = ({ theme }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Password, 3: Passkey Option
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  
  const { login, loginWithPasskey, isWebAuthnSupported } = useAuth();
  const { institution } = useInstitution();
  const navigate = useNavigate();
  const toast = useToast();

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Error', description: 'Ingresa tu email', status: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      // Check for passkeys only if supported AND device has authenticators
      let userHasPasskeys = false;
      let canUsePasskeys = false;
      
      if (isWebAuthnSupported) {
        // Verificar si el usuario tiene passkeys registradas
        userHasPasskeys = await webauthnService.checkPasskeyAvailability(email);
        
        // Verificar si el dispositivo actual puede usar passkeys
        // (tiene autenticadores biométricos disponibles)
        canUsePasskeys = await webauthnService.canDeviceUsePasskeys();
      }
      
      setHasPasskey(userHasPasskeys && canUsePasskeys);
      
      // Solo mostrar opción de passkey si:
      // 1. El usuario tiene passkeys registradas
      // 2. Y el dispositivo actual puede usarlas (tiene biométricos)
      if (userHasPasskeys && canUsePasskeys) {
        setStep(3); // Go to Passkey Option
      } else {
        // Si tiene passkeys pero el dispositivo no puede usarlas, mostrar mensaje
        if (userHasPasskeys && !canUsePasskeys) {
          toast({
            title: 'Dispositivo sin biométricos',
            description: 'Este dispositivo no tiene biométricos disponibles. Usa tu contraseña para iniciar sesión.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
        setStep(2); // Go to Password
      }
    } catch (error) {
      console.error(error);
      setStep(2); // Default to password on error
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      redirectUser();
    } else {
      toast({
        title: 'Error',
        description: result.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    try {
      // Verificar nuevamente si el dispositivo puede usar passkeys
      const canUse = await webauthnService.canDeviceUsePasskeys();
      if (!canUse) {
        throw new Error('Este dispositivo no tiene autenticadores biométricos disponibles. Por favor, usa tu contraseña.');
      }

      const result = await loginWithPasskey(email);
      if (result.success) {
        toast({ title: '¡Bienvenido!', status: 'success', duration: 2000 });
        redirectUser();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      let errorMessage = 'No se pudo validar la Passkey. Intenta con contraseña.';
      
      // Mensajes más específicos según el tipo de error
      if (error.message.includes('biométricos')) {
        errorMessage = error.message;
      } else if (error.message.includes('not allowed') || error.message.includes('NotAllowedError')) {
        errorMessage = 'La autenticación fue cancelada o no está disponible en este dispositivo. Usa tu contraseña.';
      } else if (error.message.includes('not supported') || error.message.includes('NotSupportedError')) {
        errorMessage = 'Este dispositivo no soporta autenticación biométrica. Usa tu contraseña.';
      }
      
      toast({
        title: 'No se puede usar Passkey',
        description: errorMessage,
        status: 'warning',
        duration: 6000,
        isClosable: true,
      });
      setStep(2); // Fallback to password
    } finally {
      setIsLoading(false);
    }
  };

  const redirectUser = () => {
    const user = getStorageItem('user') || {};
    
    // Check if password change is required
    // Debug campass value
    console.log('[Login Redirect] Checking user status:', user);
    
    // Validamos si ya cambió su contraseña (campass === true)
    // Si NO es true (es false, 0, null, undefined), forzamos el cambio
    const passwordChanged = user.campass === true || user.campass === 1 || user.campass === 'true';
    
    if (!passwordChanged) {
      console.log('[Login Redirect] Force Password Change triggered. Campass:', user.campass);
      navigate('/change-password');
      return;
    }

    if (user.role === 'ADMIN' || user.role === 'INSTITUTION_ADMIN' || user.role === 'GLOBAL_ADMIN') navigate('/admin');
    else if (user.role === 'PROFESOR') navigate('/profesor');
    else if (user.role === 'PADRE') navigate('/padre');
    else if (user.role === 'ALUMNO') navigate('/alumno');
    else navigate('/');
  };

  const goBack = () => {
    if (step > 1) {
      setStep(1);
      setPassword('');
      setHasPasskey(false);
    }
  };

  return (
    <Flex
      direction="column"
      minH="100vh"
      position="relative"
      overflow="hidden"
      bg="brand.900"
    >
      <LoginPageNavbar theme={theme} />
      <Box aria-hidden h={LOGIN_TOPBAR_BLOCK_SIZE} flexShrink={0} />

      <Box
        flex={1}
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH={0}
        py={{ base: 8, md: 10 }}
        px={0}
      >
        <AnimatedBackground 
          type={theme?.loginBackgroundType || "waves"}
          primaryColor={theme?.loginPrimaryColor || theme?.primaryColor}
          secondaryColor={theme?.loginSecondaryColor || theme?.secondaryColor}
          backgroundColor={theme?.loginBackgroundColor || theme?.backgroundColor}
          imageUrl={theme?.loginBackgroundUrl}
        />

        {/* Glass Card Container */}
        <Container maxW="2xl" zIndex={1} position="relative" px={4}>
        <Box
          bg="rgba(255, 255, 255, 0.85)"
          backdropFilter="blur(20px) saturate(180%)"
          borderRadius="3xl"
          border="1px solid rgba(255, 255, 255, 0.6)"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          p={{ base: 8, md: 10 }}
          textAlign="center"
          position="relative"
          transition="all 0.3s ease"
        >
          {/* Back Button */}
          {step > 1 && (
            <Button
              position="absolute"
              top={6}
              left={6}
              variant="ghost"
              size="sm"
              onClick={goBack}
              leftIcon={<FiChevronLeft />}
              color="gray.500"
              _hover={{ bg: 'gray.100', color: 'brand.500' }}
            >
              Volver
            </Button>
          )}

          <VStack spacing={6}>
              {/* Main Logo */}
              {theme && theme.logoBase64 ? (
                  <Box mb={4}>
                      <Image 
                          src={theme.logoBase64} 
                          alt="Custom Logo" 
                          maxH="80px" 
                          objectFit="contain" 
                      />
                  </Box>
              ) : null}
      
              <VStack spacing={2} w="100%">
                <Heading fontSize="2xl" fontWeight="bold" color="gray.800">
                  {step === 1 ? (theme?.nombre ? `¡Bienvenido a ${theme.nombre}!` : '¡Bienvenido de nuevo!') : 
                   step === 3 ? 'Usar Passkey' : 'Ingresa tu contraseña'}
                </Heading>
                <Text color="gray.600" fontSize="md">
                  {step === 1 ? 'Ingresa a tu panel de control' : 
                   step === 3 ? `Hola, ${email}` : `Continuar como ${email}`}
                </Text>
              </VStack>

              {/* Step 1: Email */}
              {step === 1 && (
                <Box w="100%" as="form" onSubmit={handleNextStep}>
                  <VStack spacing={5}>
                    <FormControl>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FiUser} color="brand.500" />
                        </InputLeftElement>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Usuario o Email"
                          borderRadius="full"
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          color="gray.800"
                          _placeholder={{ color: 'gray.400' }}
                          _hover={{ borderColor: 'brand.400' }}
                          _focus={{
                            borderColor: 'brand.500',
                            bg: 'white',
                            boxShadow: '0 0 0 4px rgba(0, 59, 113, 0.15)'
                          }}
                          autoFocus
                        />
                      </InputGroup>
                    </FormControl>

                    <Button
                      type="submit"
                      w="100%"
                      size="lg"
                      borderRadius="full"
                      bgGradient="linear(to-r, brand.500, brand.600)"
                      color="white"
                      fontWeight="bold"
                      isLoading={isLoading}
                      rightIcon={<FiArrowRight />}
                      _hover={{
                        bgGradient: "linear(to-r, brand.600, brand.700)",
                        boxShadow: "0 10px 20px rgba(0, 59, 113, 0.4)",
                        transform: "translateY(-2px)"
                      }}
                    >
                      Continuar
                    </Button>
                  </VStack>
                </Box>
              )}

              {/* Step 2: Password */}
              {step === 2 && (
                <Box w="100%" as="form" onSubmit={handlePasswordLogin}>
                  <Fade in={true}>
                    <VStack spacing={5}>
                      <FormControl>
                        <InputGroup size="lg">
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiLock} color="brand.500" />
                          </InputLeftElement>
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tu contraseña"
                            borderRadius="full"
                            bg="white"
                            border="1px solid"
                            borderColor="gray.200"
                            color="gray.800"
                            _placeholder={{ color: 'gray.400' }}
                            _hover={{ borderColor: 'brand.400' }}
                            _focus={{
                              borderColor: 'brand.500',
                              bg: 'white',
                              boxShadow: '0 0 0 4px rgba(0, 59, 113, 0.15)'
                            }}
                            autoFocus
                          />
                        </InputGroup>
                      </FormControl>

                      <HStack w="100%" justify="space-between">
                        <Checkbox defaultChecked colorScheme="brand">
                          <Text fontSize="sm" color="gray.600">Recordarme</Text>
                        </Checkbox>
                      </HStack>

                      <Button
                        type="submit"
                        w="100%"
                        size="lg"
                        borderRadius="full"
                        bgGradient="linear(to-r, brand.500, brand.600)"
                        color="white"
                        fontWeight="bold"
                        isLoading={isLoading}
                        rightIcon={<FiArrowRight />}
                        _hover={{
                          bgGradient: "linear(to-r, brand.600, brand.700)",
                          boxShadow: "0 10px 20px rgba(0, 59, 113, 0.4)",
                          transform: "translateY(-2px)"
                        }}
                      >
                        Iniciar Sesión
                      </Button>
                    </VStack>
                  </Fade>
                </Box>
              )}

              {/* Step 3: Passkey Option */}
              {step === 3 && (
                 <Box w="100%">
                   <Fade in={true}>
                     <VStack spacing={4}>
                        <Text fontSize="md" color="gray.600" textAlign="center">
                          Hemos detectado que tienes una Passkey configurada.
                          <br />
                          <Text as="span" fontSize="sm" color="gray.500">
                            Usa tu huella, Face ID o Touch ID para iniciar sesión.
                          </Text>
                        </Text>
                        
                        <Button
                          onClick={handlePasskeyLogin}
                          w="100%"
                          size="lg"
                          borderRadius="full"
                          bgGradient="linear(to-r, brand.500, brand.600)"
                          color="white"
                          fontWeight="bold"
                          isLoading={isLoading}
                          leftIcon={<FiKey />}
                          _hover={{
                            bgGradient: "linear(to-r, brand.600, brand.700)",
                            boxShadow: "0 10px 20px rgba(0, 59, 113, 0.4)",
                            transform: "translateY(-2px)"
                          }}
                        >
                          Usar Passkey (Huella/Face ID)
                        </Button>

                        <Button
                          variant="ghost"
                          color="gray.500"
                          size="sm"
                          onClick={() => setStep(2)}
                        >
                          Prefiero usar mi contraseña
                        </Button>
                        
                        <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
                          💡 Si este dispositivo no tiene biométricos, usa tu contraseña
                        </Text>
                     </VStack>
                   </Fade>
                 </Box>
              )}

              {/* Partner Logo Section */}
              <Box w="100%" pt={4} borderTop="1px solid" borderColor="gray.200">
                <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="widest" mb={3}>
                  Tecnología de:
                </Text>
                <VStack spacing={2}>
                   <Box
                    h="40px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                  >
                     <Text fontWeight="bold" color="gray.500">KeMarketing</Text>
                  </Box>
                </VStack>
              </Box>

              <Text fontSize="xs" color="gray.400" mt={2}>
                © {new Date().getFullYear()} KeMarketing. Todos los derechos reservados.
              </Text>
            </VStack>
          </Box>
          </Container>
        </Box>
      </Flex>
    );
  };
  
  export default LoginDefault;

