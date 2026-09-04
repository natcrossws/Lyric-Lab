import { Box, Heading, Text, VStack, Container } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef } from 'react';
import LoginAnimatedBackground from '@/shared/components/ui/LoginAnimatedBackground';
import LoginPageNavbar, { LOGIN_TOPBAR_BLOCK_SIZE } from '@/shared/components/layout/LoginPageNavbar';

const GlassDocumentContainer = ({ title, content, children, actions, simpleMode = false }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [content, title]);

  return (
    <Box
      minH={simpleMode ? "100%" : "100vh"}
      w="100%"
      position="relative"
      bg={simpleMode ? "white" : "brand.900"}
      overflowY={simpleMode ? "hidden" : "auto"} // Let inner box scroll in simple mode
      py={simpleMode ? 0 : 10}
      height={simpleMode ? "100%" : "auto"}
      display={simpleMode ? "flex" : "block"}
      flexDirection="column"
    >
        {!simpleMode && (
          <>
            <LoginPageNavbar />
            <Box aria-hidden h={LOGIN_TOPBAR_BLOCK_SIZE} flexShrink={0} />
          </>
        )}

        {!simpleMode && <LoginAnimatedBackground />}

        <Container maxW={simpleMode ? "100%" : "4xl"} position="relative" zIndex={1} p={simpleMode ? 0 : 4} h={simpleMode ? "100%" : "auto"}>
            <Box
                bg={simpleMode ? "white" : "rgba(255, 255, 255, 0.9)"}
                backdropFilter={simpleMode ? "none" : "blur(20px) saturate(180%)"}
                borderRadius={simpleMode ? "none" : "3xl"}
                border={simpleMode ? "none" : "1px solid rgba(255, 255, 255, 0.6)"}
                boxShadow={simpleMode ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.5)"}
                p={{ base: 0, md: simpleMode ? 0 : 10 }}
                maxH={simpleMode ? "100%" : "85vh"}
                h={simpleMode ? "100%" : "auto"}
                display="flex"
                flexDirection="column"
            >
                <VStack spacing={simpleMode ? 0 : 6} align="stretch" flex="1" overflow="hidden">
                    {/* Header */}
                    <Box 
                        textAlign="center" 
                        borderBottom="1px solid" 
                        borderColor="gray.100" 
                        pb={simpleMode ? 4 : 4}
                        pt={simpleMode ? 4 : 0}
                        bg={simpleMode ? "white" : "transparent"}
                        zIndex={2}
                        px={simpleMode ? 6 : 0}
                    >
                        <Heading size="lg" color="brand.800">{title}</Heading>
                    </Box>

                    {/* Content Scrollable */}
                    <Box 
                        ref={scrollRef}
                        flex="1" 
                        overflowY="auto"
                        bg="white"
                        p={simpleMode ? 8 : 0}
                        css={{
                            '&::-webkit-scrollbar': {
                            width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                            width: '8px',
                            background: 'var(--chakra-colors-brand-50)',
                            },
                            '&::-webkit-scrollbar-thumb': {
                            background: 'linear-gradient(180deg, var(--chakra-colors-brand-500), #0A3323, #839958)',
                            borderRadius: '24px',
                            },
                        }}
                    >
                         <Box
                            className="markdown-body"
                            sx={{
                                'h1': { fontSize: '2xl', fontWeight: 'bold', mb: 4, color: 'brand.700' },
                                'h2': { fontSize: 'xl', fontWeight: 'bold', mt: 6, mb: 3, color: 'brand.600' },
                                'h3': { fontSize: 'lg', fontWeight: 'bold', mt: 4, mb: 2, color: 'brand.600' },
                                'p': { mb: 4, lineHeight: '1.7', color: 'gray.700' },
                                'ul': { pl: 6, mb: 4 },
                                'li': { mb: 2, color: 'gray.700' },
                                'strong': { color: 'brand.800' }
                            }}
                        >
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </Box>
                    </Box>

                     {/* Footer / Actions */}
                     {(children || actions) && (
                        <Box 
                            pt={4} 
                            pb={simpleMode ? 4 : 0}
                            px={simpleMode ? 6 : 0}
                            bg={simpleMode ? "gray.50" : "transparent"}
                            borderTop={simpleMode ? "1px solid" : "1px solid"} 
                            borderColor="gray.200"
                        >
                            {children || actions}
                        </Box>
                     )}
                </VStack>
            </Box>
        </Container>
    </Box>
  );
};

export default GlassDocumentContainer;
