import { useState } from 'react';
import { Box, Heading, Text, VStack, Container, Code } from '@chakra-ui/react';
import AudioRecorder from '@/shared/components/forms/AudioRecorder';

const TestAudioPage = () => {
    const [analysisResult, setAnalysisResult] = useState(null);

    return (
        <Container maxW="container.md" py={10}>
            <VStack spacing={8} align="stretch">
                <Box textAlign="center">
                    <Heading color="brand.900" mb={2}>Prueba de Sistema de Audio IA</Heading>
                    <Text color="gray.600">
                        Graba un reporte de prueba. El audio se enviará a R2 y será analizado por Gemini 1.5 Flash.
                    </Text>
                </Box>

                <AudioRecorder onAnalysisComplete={(result) => setAnalysisResult(result)} />

                {analysisResult && (
                    <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                        <Heading size="md" mb={4}>Resultado del Análisis (JSON):</Heading>
                        <Code display="block" whiteSpace="pre" p={2} borderRadius="md">
                            {JSON.stringify(analysisResult, null, 2)}
                        </Code>
                    </Box>
                )}
            </VStack>
        </Container>
    );
};

export default TestAudioPage;
