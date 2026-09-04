import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Text, 
    VStack, 
    HStack, 
    Badge, 
    Table, 
    Thead, 
    Tbody, 
    Tr, 
    Th, 
    Td,
    Tooltip,
    IconButton,
    useColorModeValue,
    Icon,
    Spinner,
    Flex
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaWhatsapp, FaUserTimes, FaMoneyBillWave } from 'react-icons/fa';
import api from '@/shared/services/api';

const RiskWidget = () => {
    const [riskyStudents, setRiskyStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const glassBg = useColorModeValue('rgba(255, 255, 255, 0.25)', 'rgba(29, 32, 37, 0.45)');
    const borderColor = useColorModeValue('whiteAlpha.400', 'whiteAlpha.200');

    useEffect(() => {
        const fetchRisk = async () => {
            try {
                const res = await api.get('/monitor/risk');
                if (res.data.success) {
                    setRiskyStudents(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching risk data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRisk();
    }, []);

    const handleWhatsapp = (phone, name, riskType) => {
        if (!phone) return;
        const msg = `Hola, le contactamos de la Escuela de Arte para discutir un tema importante sobre ${name} (${riskType === 'DEBT' ? 'Pagos pendientes' : riskType === 'ABSENCE' ? 'Asistencias' : 'Académico'}). ¿Podría atendernos?`;
        const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <Flex 
                p={5} 
                className="glass-card" 
                bg={glassBg} 
                backdropFilter="blur(10px)" 
                border="1px solid" 
                borderColor={borderColor}
                borderRadius="xl"
                align="center" 
                justify="center"
                minH="200px"
            >
                <Spinner color="red.400" />
            </Flex>
        );
    }

    if (riskyStudents.length === 0) {
        return (
            <Box 
                p={5} 
                className="glass-card" 
                bg={glassBg} 
                backdropFilter="blur(10px)" 
                border="1px solid" 
                borderColor={borderColor}
                borderRadius="xl"
            >
                <HStack mb={4}>
                    <Icon as={FaExclamationTriangle} color="green.400" />
                    <Text fontSize="lg" fontWeight="bold">Semáforo de Riesgo</Text>
                </HStack>
                <Text color="gray.500" fontStyle="italic">No hay alumnos en riesgo alto por ahora. ¡Excelente!</Text>
            </Box>
        );
    }

    return (
        <Box 
            p={5} 
            className="glass-card" 
            bg={glassBg} 
            backdropFilter="blur(10px)" 
            border="1px solid" 
            borderColor="red.300"
            borderRadius="xl"
            boxShadow="0 0 15px rgba(229, 62, 62, 0.15)"
            transition="all 0.3s"
            _hover={{
                boxShadow: "0 0 25px rgba(229, 62, 62, 0.25)"
            }}
        >
            <HStack mb={4} justify="space-between">
                <HStack>
                    <Icon as={FaExclamationTriangle} color="red.400" w={5} h={5} />
                    <Text fontSize="lg" fontWeight="bold" color="red.400">Atención Requerida</Text>
                </HStack>
                <Badge colorScheme="red" variant="solid" borderRadius="full" px={3}>
                    {riskyStudents.length} Alumnos
                </Badge>
            </HStack>

            <Box overflowX="auto" maxH="300px" overflowY="auto">
                <Table size="sm" variant="unstyled">
                    <Thead>
                        <Tr borderBottom="1px solid" borderColor={borderColor}>
                            <Th color="gray.500">Alumno</Th>
                            <Th color="gray.500">Riesgo</Th>
                            <Th isNumeric color="gray.500">Acción</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {riskyStudents.map((student) => (
                            <Tr key={student.id_usuario} _hover={{ bg: "whiteAlpha.100" }}>
                                <Td fontWeight="medium">
                                    <VStack align="start" spacing={0}>
                                        <Text>{student.nombre}</Text>
                                        <Text fontSize="xs" color="gray.500">{student.telefono || 'Sin teléfono'}</Text>
                                    </VStack>
                                </Td>
                                <Td>
                                    <Tooltip label={student.details} hasArrow>
                                        <HStack>
                                            <Icon 
                                                as={student.riskType === 'DEBT' ? FaMoneyBillWave : student.riskType === 'ABSENCE' ? FaUserTimes : FaExclamationTriangle} 
                                                color={student.riskType === 'DEBT' ? 'orange.400' : 'red.400'} 
                                            />
                                            <Text fontSize="sm" noOfLines={1} maxW="150px">
                                                {student.riskType === 'DEBT' ? 'Mora' : student.riskType === 'ABSENCE' ? 'Ausentismo' : 'Combinado'}
                                            </Text>
                                        </HStack>
                                    </Tooltip>
                                </Td>
                                <Td isNumeric>
                                    <Tooltip label="Contactar por WhatsApp">
                                        <IconButton
                                            aria-label="WhatsApp"
                                            icon={<FaWhatsapp />}
                                            size="sm"
                                            colorScheme="whatsapp"
                                            variant="ghost"
                                            onClick={() => handleWhatsapp(student.telefono, student.nombre, student.riskType)}
                                            isDisabled={!student.telefono}
                                        />
                                    </Tooltip>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );
};

export default RiskWidget;
