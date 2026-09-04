import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Button,
    Flex,
    Text,
    useToast,
    VStack,
    HStack,
    Collapse
} from '@chakra-ui/react';
import { FiMic, FiSquare, FiCpu } from 'react-icons/fi';
import { io } from 'socket.io-client';

const AudioRecorder = ({ onAnalysisComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [streamId, setStreamId] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const socketRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);

    const toast = useToast();

    // Initialize Socket.io
    useEffect(() => {
        // Connect to backend (adjust URL if needed)
        // Mismo origen: en dev Vite proxy reenvía /socket.io al backend (evita TLS localhost:3000 en Safari).
        socketRef.current = io();

        socketRef.current.on('connect', () => {
            console.log('🔌 Socket connected');
        });

        socketRef.current.on('stream_started', (data) => {
            console.log('🎙️ Stream ID:', data.streamId);
            setStreamId(data.streamId);
        });

        socketRef.current.on('processing_complete', (data) => {
            setIsProcessing(false);
            if (data.success) {
                toast({
                    title: "Procesamiento Completado",
                    description: "Audio limpio y listo.",
                    status: "success",
                    duration: 5000
                });
                if (onAnalysisComplete) {
                    onAnalysisComplete({ 
                        success: true, 
                        streamId: data.streamId, 
                        audioUrl: data.fileUrl 
                    });
                }
            }
        });

        socketRef.current.on('processing_error', (err) => {
            setIsProcessing(false);
            toast({
                title: "Error",
                description: "Error procesando el audio.",
                status: "error"
            });
            console.error(err);
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [onAnalysisComplete, toast]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Visualization Setup
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            // MediaRecorder Setup
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0 && socketRef.current) {
                    // Stream chunk to server
                    socketRef.current.emit('audio_chunk', e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                cancelAnimationFrame(animationRef.current);
            };

            // Start Recording & Stream
            socketRef.current.emit('start_stream');
            mediaRecorderRef.current.start(1000); // 1-second chunks
            
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            drawWaveform();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast({
                title: "Error de micrófono",
                description: "No se pudo acceder al micrófono.",
                status: "error"
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true); // Waiting for server processing
            socketRef.current.emit('stop_stream');
            clearInterval(timerRef.current);
        }
    };

    const drawWaveform = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);

            canvasCtx.fillStyle = 'rgba(0, 0, 0, 0)'; 
            canvasCtx.clearRect(0, 0, width, height);

            const barWidth = (width / dataArrayRef.current.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArrayRef.current.length; i++) {
                barHeight = dataArrayRef.current[i] / 2;
                const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, 'rgba(0, 59, 113, 0.5)'); 
                gradient.addColorStop(1, 'rgba(var(--chakra-colors-red-500),  0.8)'); 

                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <Box 
            p={6} 
            borderRadius="2xl" 
            bg="rgba(255, 255, 255, 0.25)" 
            backdropFilter="blur(16px)" 
            border="1px solid rgba(255, 255, 255, 0.3)"
            boxShadow="0 8px 32px rgba(0, 59, 113, 0.15)"
            maxW="500px"
            mx="auto"
            textAlign="center"
        >
            <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="bold" color="brand.800">
                    Bitácora de Voz (Streaming) 🎙️
                </Text>

                <Box h="80px" w="100%" bg="rgba(255,255,255,0.4)" borderRadius="lg" position="relative" overflow="hidden">
                    <canvas ref={canvasRef} width="400" height="80" style={{ width: '100%', height: '100%' }} />
                    {!isRecording && !isProcessing && (
                        <Flex position="absolute" top="0" left="0" right="0" bottom="0" justify="center" align="center">
                            <Text fontSize="xs" color="gray.500">Presiona grabar para iniciar</Text>
                        </Flex>
                    )}
                </Box>

                <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold" color="gray.700">
                    {formatTime(recordingTime)}
                </Text>

                <HStack spacing={4}>
                    {!isRecording ? (
                        <Button
                            leftIcon={<FiMic />}
                            colorScheme="red"
                            size="lg"
                            borderRadius="full"
                            onClick={startRecording}
                            isDisabled={isProcessing}
                            zIndex={2}
                            _hover={{ transform: 'scale(1.05)', boxShadow: 'lg' }}
                        >
                            {streamId ? 'Grabar Nuevo' : 'Grabar'}
                        </Button>
                    ) : (
                        <Button
                            leftIcon={<FiSquare />}
                            colorScheme="gray"
                            size="lg"
                            borderRadius="full"
                            onClick={stopRecording}
                            zIndex={2}
                        >
                            Detener
                        </Button>
                    )}
                </HStack>

                <Collapse in={isProcessing} animateOpacity style={{ width: '100%' }}>
                    <VStack spacing={3} mt={4} w="100%">
                        <Text fontSize="sm" color="brand.600" fontWeight="bold">Procesando audio y limpiando ruido...</Text>
                        <Button
                            rightIcon={<FiCpu />}
                            colorScheme="blue"
                            w="100%"
                            size="lg"
                            isLoading={true}
                            loadingText="Finalizando..."
                            variant="ghost"
                        >
                            Procesando
                        </Button>
                    </VStack>
                </Collapse>
            </VStack>
        </Box>
    );
};

export default AudioRecorder;
