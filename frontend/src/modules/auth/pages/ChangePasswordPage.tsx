// @ts-nocheck
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  InputGroup,
  InputRightElement,
  Icon,
  Flex
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/services/api';
import { useAuth } from '@/core/context/AuthContext';
import { getStorageItem, setStorageItem } from '@/shared/utils/storage';
import LoginAnimatedBackground from '@/shared/components/ui/LoginAnimatedBackground';
import LoginPageNavbar, { LOGIN_TOPBAR_BLOCK_SIZE } from '@/shared/components/layout/LoginPageNavbar';

const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth(); // We might not want to logout immediately if successful, but let's see.

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // In forced change mode, we might not send currentPassword. 
      // The backend now supports this via `user.campass` check.
      await api.post('/auth/change-password', {
        newPassword
      });

      toast({
        title: 'Contraseña actualizada',
        description: 'Contraseña actualizada correctamente. Redirigiendo...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update local storage to reflect the change immediately so we don't loop
      const user = getStorageItem('user');
      if (user) {
        user.campass = true;
        setStorageItem('user', user);
      }

      // Redirect based on role or home
      setTimeout(() => {
         if (user?.role === 'ADMIN' || user?.role === 'INSTITUTION_ADMIN' || user?.role === 'GLOBAL_ADMIN') navigate('/admin');
         else if (user?.role === 'PROFESOR') navigate('/profesor');
         else if (user?.role === 'PADRE') navigate('/padre');
         else if (user?.role === 'ALUMNO') navigate('/alumno');
         else navigate('/');
      }, 1500);

    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al actualizar contraseña',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      direction="column"
      position="relative"
      overflow="hidden"
      bg="brand.900"
    >
      <LoginPageNavbar />
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
      <LoginAnimatedBackground />

      {/* Glass Card Container */}
      <Container maxW="md" zIndex={1} position="relative" px={4}>
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
            _hover={{
              transform: 'translateY(-5px)',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6)',
              bg: 'rgba(255, 255, 255, 0.9)'
            }}
        >
            <VStack spacing={6}>
              <Box textAlign="center">
                <Box 
                  display="inline-flex" 
                  p={4} 
                  borderRadius="full" 
                  bg="rgba(var(--brand-rgb),  0.12)" 
                  mb={4}
                >
                    <Icon as={FiLock} boxSize={8} color="brand.500" />
                </Box>
                <Heading size="lg" mb={2} color="brand.500" letterSpacing="-0.5px">
                    Cambio Requerido
                </Heading>
                <Text color="gray.600" fontSize="md">
                  Por seguridad, actualiza tu contraseña para continuar.
                </Text>
              </Box>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" color="brand.500" ml={1}>Nueva Contraseña</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        bg="white"
                        border="2px solid"
                        borderColor="transparent"
                        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                        _hover={{ bg: 'gray.50' }}
                        height="50px"
                        borderRadius="xl"
                        fontSize="md"
                      />
                      <InputRightElement height="50px">
                        <Button variant="ghost" onClick={() => setShowPassword(!showPassword)} size="sm" borderRadius="full">
                           <Icon as={showPassword ? FiEyeOff : FiEye} color="gray.500" />
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontWeight="600" color="brand.500" ml={1}>Confirmar Contraseña</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        bg="white"
                        border="2px solid"
                        borderColor="transparent"
                        _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                        _hover={{ bg: 'gray.50' }}
                        height="50px"
                        borderRadius="xl"
                        fontSize="md"
                      />
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="full"
                    isLoading={loading}
                    mt={2}
                    bgGradient="linear(to-r, brand.500, brand.600)"
                    _hover={{ bgGradient: 'linear(to-r, brand.600, brand.700)', transform: 'scale(1.02)' }}
                    _active={{ transform: 'scale(0.98)' }}
                    height="54px"
                    borderRadius="xl"
                    boxShadow="0 10px 20px -5px rgba(var(--brand-rgb),  0.38)"
                    fontSize="lg"
                  >
                    Actualizar Contraseña
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    width="full" 
                    size="sm" 
                    onClick={() => { logout(); navigate('/login'); }}
                    color="gray.500"
                    _hover={{ bg: 'rgba(0,0,0,0.05)', color: 'gray.700' }}
                  >
                      Cancelar y Salir
                  </Button>
                </VStack>
              </form>
            </VStack>
        </Box>
      </Container>
      </Box>
    </Flex>
  );
};

export default ChangePasswordPage;
