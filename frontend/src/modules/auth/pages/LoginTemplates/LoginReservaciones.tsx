import React from 'react';
import { Box, Heading, Text, Center, Image, VStack, Button, Input } from '@chakra-ui/react';

const LoginReservaciones = ({ theme }) => {
  return (
    <Center h="100vh" bg="brand.50">
      <Box p={8} bg="white" rounded="xl" shadow="xl" maxW="md" w="full" textAlign="center">
        {theme?.logoBase64 && <Image src={theme.logoBase64} mx="auto" maxH="80px" mb={4} />}
        <Heading color="brand.600" mb={2}>{theme?.nombre || 'LoginReservaciones'}</Heading>
        <Text color="gray.500" mb={6}>Bienvenido a la plantilla LoginReservaciones</Text>
        
        <VStack spacing={4}>
          <Input placeholder="Usuario" focusBorderColor="brand.500" />
          <Input placeholder="Contraseña" type="password" focusBorderColor="brand.500" />
          <Button w="full" colorScheme="brand" onClick={() => window.location.href='/admin'}>Entrar</Button>
        </VStack>
      </Box>
    </Center>
  );
};
export default LoginReservaciones;
