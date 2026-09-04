import React, { useState } from 'react';
import { Box, Flex, Heading, Text, Center, Image, VStack, Button, Input, Icon, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { FiUser, FiLock } from 'react-icons/fi';
import { useAuth } from '@/core/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPlayas = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await login(email, password);
    if(res.success) navigate('/admin');
  };

  return (
    <Flex h="100vh" w="100vw" bgImage="url('https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" bgSize="cover" bgPos="center">
      <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="rgba(0,0,0,0.4)" />
      <Center w="100%" zIndex={1}>
        <Box p={10} bg="whiteAlpha.900" backdropFilter="blur(10px)" rounded="3xl" shadow="2xl" maxW="md" w="full" textAlign="center">
          {theme?.logoBase64 && <Image src={theme.logoBase64} mx="auto" maxH="90px" mb={6} />}
          <Heading color="brand.600" mb={2} fontFamily="'Playfair Display', serif">{theme?.nombre || 'Resort & Spa'}</Heading>
          <Text color="gray.600" mb={8} fontSize="sm" letterSpacing="widest" textTransform="uppercase">Exclusive Portal</Text>
          
          <VStack spacing={5}>
            <InputGroup size="lg">
              <InputLeftElement><Icon as={FiUser} color="brand.500" /></InputLeftElement>
              <Input variant="flushed" placeholder="Email o Usuario" focusBorderColor="brand.500" value={email} onChange={e => setEmail(e.target.value)} />
            </InputGroup>
            <InputGroup size="lg">
              <InputLeftElement><Icon as={FiLock} color="brand.500" /></InputLeftElement>
              <Input variant="flushed" type="password" placeholder="Contraseña" focusBorderColor="brand.500" value={password} onChange={e => setPassword(e.target.value)} />
            </InputGroup>
            <Button mt={4} w="full" size="lg" colorScheme="brand" rounded="full" onClick={handleLogin}>Acceder</Button>
          </VStack>
        </Box>
      </Center>
    </Flex>
  );
};
export default LoginPlayas;
