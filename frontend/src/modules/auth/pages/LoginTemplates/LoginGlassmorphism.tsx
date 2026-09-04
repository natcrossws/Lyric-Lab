import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Center, Image, VStack, Button, Input } from '@chakra-ui/react';
import { useAuth } from '@/core/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginGlassmorphism = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await login(email, password);
    if(res.success) navigate('/admin');
  };

  return (
    <Flex h="100vh" w="100vw" bgGradient="linear(to-br, brand.400, secondary.600)">
      <Box position="absolute" top="10%" left="20%" w="300px" h="300px" bg="brand.200" rounded="full" filter="blur(80px)" opacity={0.6} />
      <Box position="absolute" bottom="10%" right="20%" w="400px" h="400px" bg="secondary.300" rounded="full" filter="blur(100px)" opacity={0.6} />
      
      <Center w="100%" zIndex={1}>
        <Box 
          p={10} 
          bg="rgba(255, 255, 255, 0.1)" 
          backdropFilter="blur(24px)" 
          border="1px solid rgba(255, 255, 255, 0.2)"
          rounded="2xl" 
          shadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)" 
          maxW="md" w="full" textAlign="center"
        >
          {theme?.logoBase64 && <Image src={theme.logoBase64} mx="auto" maxH="80px" mb={6} filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))" />}
          <Heading color="white" mb={2} fontWeight="300">{theme?.nombre || 'Glass App'}</Heading>
          <Text color="whiteAlpha.800" mb={8}>Acceso al sistema</Text>
          
          <VStack spacing={4}>
            <Input 
              placeholder="Usuario" 
              bg="rgba(255,255,255,0.05)" 
              border="1px solid rgba(255,255,255,0.2)" 
              color="white" 
              _placeholder={{ color: 'whiteAlpha.600' }}
              _focus={{ bg: 'rgba(255,255,255,0.1)', borderColor: 'white' }}
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <Input 
              placeholder="Contraseña" type="password" 
              bg="rgba(255,255,255,0.05)" 
              border="1px solid rgba(255,255,255,0.2)" 
              color="white" 
              _placeholder={{ color: 'whiteAlpha.600' }}
              _focus={{ bg: 'rgba(255,255,255,0.1)', borderColor: 'white' }}
              value={password} onChange={e => setPassword(e.target.value)}
            />
            <Button mt={4} w="full" bg="whiteAlpha.300" color="white" _hover={{ bg: 'whiteAlpha.400' }} onClick={handleLogin}>
              Ingresar
            </Button>
          </VStack>
        </Box>
      </Center>
    </Flex>
  );
};
export default LoginGlassmorphism;
