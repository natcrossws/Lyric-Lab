import React from 'react';
import { Box, Grid, GridItem, Text, Icon, Flex } from '@chakra-ui/react';
import { BiMusic, BiPalette, BiDesktop, BiMicrophone, BiSun, BiCircle, BiUser } from 'react-icons/bi';

const getIconComponent = (iconId) => {
    const ICON_MAP = {
        'piano': BiMusic,
        'palette': BiPalette,
        'desktop': BiDesktop,
        'mic': BiMicrophone,
        'sun': BiSun,
        'circle': BiCircle
    };
    return ICON_MAP[iconId] || BiCircle;
};

const HOURS = Array.from({ length: 26 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8; // Start at 8:00
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
}); // 8:00 to 20:30

const COLORS = [
    'brand.100', 'green.100', 'purple.100', 'orange.100', 'teal.100', 'red.100', 'cyan.100'
];

const DailyRoomScheduler = ({ salones, classes, selectedDay }) => {
    const getClassesForSlot = (salonId, timeSlot) => {
        return classes.filter(clase => {
            if (clase.dia_semana !== selectedDay) return false;
            // Handle both id_salon (old) and salon?.id (populated) - UPDATE: Check specific fields
            const claseSalonId = clase.salon?.id_salon || clase.salon?.id || clase.fk_id_salon || clase.id_salon;
            if (parseInt(claseSalonId) !== parseInt(salonId)) return false;

            const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
            const slotTime = slotHour * 60 + slotMinute;

            const [startHour, startMinute] = clase.hora_inicio.split(':').map(Number);
            const startTime = startHour * 60 + startMinute;

            const [endHour, endMinute] = clase.hora_fin.split(':').map(Number);
            const endTime = endHour * 60 + endMinute;

            // Check overlap: logic for 30 min blocks
            // If the slot starts at or after class start AND before class end
            return slotTime >= startTime && slotTime < endTime;
        });
    };

    const isStartOfClass = (clase, timeSlot) => {
        const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
        const [startHour, startMinute] = clase.hora_inicio.split(':').map(Number);
        return slotHour === startHour && slotMinute === startMinute;
    };

    const getClassDurationSlots = (clase) => {
        const [startHour, startMinute] = clase.hora_inicio.split(':').map(Number);
        const [endHour, endMinute] = clase.hora_fin.split(':').map(Number);
        const diffMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        return Math.ceil(diffMinutes / 30);
    };

    // Helper to assign a stable color based on subject ID
    const getColorForClass = (materia) => {
        if (!materia) return COLORS[0];
        // If materia has a color, use it (future proofing)
        if (materia.color_hex) return materia.color_hex; // Assuming hex or similar
        // Fallback to ID hash
        const id = materia.id || 0;
        return COLORS[id % COLORS.length];
    };

    return (
        <Box overflowX="auto" bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200">
            <Grid templateColumns={`100px repeat(${salones.length}, minmax(150px, 1fr))`} minW={`${salones.length * 150 + 100}px`}>

                {/* Header Row */}
                <GridItem borderBottom="2px solid" borderColor="gray.300" bg="gray.50" p={2} position="sticky" top={0} zIndex={10}>
                    <Box h="100%" display="flex" alignItems="center" justifyContent="center">
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">{selectedDay}</Text>
                    </Box>
                </GridItem>
                {salones.map((salon, idx) => (
                    <GridItem key={salon.id} borderBottom="2px solid" borderColor="gray.300" borderLeft="1px solid" borderLeftColor="gray.200" bg="gray.100" p={2}>
                        <Flex direction="column" align="center" justify="center">
                            <Box
                                w="32px" h="32px"
                                borderRadius="md"
                                bg={`${salon.color || 'blue'}.100`}
                                color={`${salon.color || 'blue'}.600`}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                mb={1}
                            >
                                <Icon as={getIconComponent(salon.icon)} fontSize="18px" />
                            </Box>
                            <Text fontWeight="bold" fontSize="sm" textAlign="center">{salon.nombre}</Text>
                            <Text fontSize="xs" color="gray.500">{salon.tipo}</Text>
                        </Flex>
                    </GridItem>
                ))}

                {/* Grid Body */}
                {HOURS.map((time, rowIdx) => (
                    <React.Fragment key={time}>
                        {/* Time Label */}
                        <GridItem borderBottom="1px solid" borderColor="gray.100" p={2} bg="gray.50">
                            <Text fontSize="xs" color="gray.500" fontWeight="bold">{time}</Text>
                        </GridItem>

                        {/* Salon Slots */}
                        {salones.map(salon => {
                            const activeClasses = getClassesForSlot(salon.id, time);

                            // Find class that should display its header here
                            // 1. Strictly starts here OR
                            // 2. Is occupied here BUT was NOT occupied in previous slot (Visual Start)
                            const startingClass = activeClasses.find(c => {
                                if (isStartOfClass(c, time)) return true;
                                if (rowIdx === 0) return true; // Starts before or at grid start

                                const prevTime = HOURS[rowIdx - 1];
                                const prevClasses = getClassesForSlot(salon.id, prevTime);
                                const wasActive = prevClasses.some(pc => pc.id_clase === c.id_clase); // Compare IDs
                                return !wasActive;
                            });

                            const isOccupied = activeClasses.length > 0;

                            if (startingClass) {
                                // Start of class (Actual or Visual): Render header info
                                const profesor = startingClass.profesor || { nombre: 'Sin Profesor' };
                                const materia = startingClass.materia || { nombre: 'Clase', icono: 'circle' };
                                const alumno = startingClass.alumno || { nombre: 'Sin Alumno' };
                                const color = getColorForClass(materia);

                                return (
                                    <GridItem
                                        key={`${salon.id}-${time}`}
                                        borderLeft="1px solid"
                                        borderLeftColor="gray.200"
                                        bg="white"
                                        p={0}
                                        borderBottom="none"
                                        borderColor="gray.100"
                                        zIndex={2}
                                        overflow="visible"
                                    >
                                        <Box
                                            bg={color}
                                            h="100%"
                                            p={1.5}
                                            borderTopRadius="md"
                                            borderLeft="4px solid"
                                            borderLeftColor="rgba(0,0,0,0.2)"
                                            overflow="hidden"
                                            boxShadow="sm"
                                            position="relative"
                                        >
                                            <Flex align="center" mb={1} gap={1}>
                                                <Icon as={getIconComponent(materia.icono)} color="whiteAlpha.900" boxSize={3} />
                                                <Text fontWeight="800" fontSize="xs" color="white" noOfLines={1} textShadow="0px 1px 2px rgba(0,0,0,0.3)">
                                                    {materia.nombre}
                                                </Text>
                                            </Flex>

                                            <Flex direction="column" gap="2px">
                                                <Flex align="center" gap={1}>
                                                    <Icon as={BiUser} color="whiteAlpha.800" boxSize={2.5} />
                                                    <Text fontSize="9px" color="white" fontWeight="600" noOfLines={1} textShadow="0px 0px 1px rgba(0,0,0,0.2)">
                                                        {profesor.nombre}
                                                    </Text>
                                                </Flex>
                                                <Flex align="center" gap={1}>
                                                    <Icon as={BiUser} color="whiteAlpha.800" boxSize={2.5} />
                                                    <Text fontSize="9px" color="white" fontWeight="600" noOfLines={1} textShadow="0px 0px 1px rgba(0,0,0,0.2)">
                                                        {alumno.nombre}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </Box>
                                    </GridItem>
                                );
                            } else if (isOccupied) {
                                // Continuation of class
                                const clase = activeClasses[0];
                                const materia = clase.materia || { nombre: 'Clase' };
                                const color = getColorForClass(materia);

                                return (
                                    <GridItem
                                        key={`${salon.id}-${time}`}
                                        borderLeft="1px solid"
                                        borderLeftColor="gray.200"
                                        bg="white"
                                        p={0}
                                        borderBottom="none"
                                        borderColor="gray.100"
                                    >
                                        <Box
                                            bg={color}
                                            h="100%"
                                            borderLeft="4px solid"
                                            borderLeftColor="brand.500"
                                        />
                                    </GridItem>
                                );
                            }

                            // Empty slot
                            return (
                                <GridItem
                                    key={`${salon.id}-${time}`}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                    borderLeft="1px solid"
                                    borderLeftColor="gray.200"
                                    _hover={{ bg: 'gray.50' }}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </Grid>
        </Box>
    );
};

export default DailyRoomScheduler;
