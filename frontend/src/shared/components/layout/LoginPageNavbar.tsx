import { Box, Flex, Text, VStack, Image } from '@chakra-ui/react';

/** Altura de la barra fija (spacer en `LoginPage` debe coincidir). WebKit usa barras fixed junto al borde para teñir Safari. */
export const LOGIN_TOPBAR_BLOCK_SIZE = '56px';

/**
 * Barra superior del login: azul sólido de marca (mismo criterio que navbar principal).
 */
const LoginPageNavbar = ({ theme }: { theme?: any }) => (
  <Flex
    as="header"
    role="banner"
    align="center"
    justify="center"
    minH={LOGIN_TOPBAR_BLOCK_SIZE}
    px={{ base: 4, md: 8 }}
    py={2.5}
    flexShrink={0}
    bg="brand.500"
    borderBottom="1px solid rgba(255,255,255,0.14)"
    boxShadow="0 8px 32px rgba(0, 26, 51, 0.35), inset 0 -1px 0 rgba(255,158,27,0.22)"
    position="fixed"
    top={0}
    left={0}
    right={0}
    w="100%"
    zIndex={100}
  >
    <VStack spacing={0} textAlign="center" align="center" justify="center">
      {theme?.logoBase64 ? (
        <Image src={theme.logoBase64} alt="Logo" maxH="28px" objectFit="contain" />
      ) : (
        <Text fontSize="sm" fontWeight="800" color="white" letterSpacing="0.04em" lineHeight="1.15">
          {theme?.nombre || 'Mi Sistema'}
        </Text>
      )}
      {!theme?.logoBase64 && (
        <Text
        fontSize="10px"
        fontWeight="600"
        color="whiteAlpha.800"
        letterSpacing="0.14em"
        textTransform="uppercase"
      >
        Acceso
      </Text>
      )}
    </VStack>
    <Box
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      h="2px"
      pointerEvents="none"
      bgGradient="linear(to-r, transparent 4%, rgba(255,158,27,0.75) 38%, rgba(var(--chakra-colors-red-500), 0.85) 52%, rgba(255,158,27,0.55) 68%, transparent 96%)"
    />
  </Flex>
);

export default LoginPageNavbar;
