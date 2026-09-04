import React from 'react';
import { Box, Grid, GridItem, Text, Tooltip, VStack, HStack, Avatar, Icon, Badge, Flex } from '@chakra-ui/react';

const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

const WeeklyGrid = ({ existingClasses, onSlotClick, selectedDay, selectedHour, materias = [], salones = [], profesores = [], getIconComponent, currentWeekStart }) => {

    // Generate dates for the displayed week based on currentWeekStart
    // currentWeekStart is expected to be a Monday
    const weekDates = React.useMemo(() => {
        const dates = [];
        const start = currentWeekStart ? new Date(currentWeekStart) : new Date();
        // Ensure we start on Monday if not already (simple correction)
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(start.setDate(diff));

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push({
                dateObj: date,
                dayName: DAYS_MAP[date.getDay()],
                dateString: date.toISOString().split('T')[0],
                label: `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })}`
            });
        }
        return dates;
    }, [currentWeekStart]);

    const getSlotClasses = (dayName, hour, dateString) => {
        if (!existingClasses) return [];
        return existingClasses.filter(clase => {
            // 1. Day Name Match
            if (clase.dia_semana !== dayName) return false;

            // 2. Date Range Match (Robustness check)
            // Ensure the specific column date is within the class validity
            if (dateString) {
                const colDate = dateString; // YYYY-MM-DD
                if (clase.fecha_inicio && colDate < clase.fecha_inicio) return false;
                if (clase.fecha_fin && colDate > clase.fecha_fin) return false;
            }

            // 3. Time Match
            const start = parseInt(clase.hora_inicio.split(':')[0]);
            const end = parseInt(clase.hora_fin.split(':')[0]);
            return hour >= start && hour < end;
        });
    };

    const getProfesorName = (id) => {
        const prof = profesores.find(p => p.id_usuario === id);
        return prof ? prof.nombre.split(' ')[0] : 'Prof.';
    };

    const getMateriaInfo = (id) => {
        const mat = materias.find(m => m.id_cat_materia === id);
        return {
            nombre: mat ? mat.nombre : 'Clase',
            color: mat ? (mat.color || 'blue') : 'blue',
            icono: mat ? (mat.icono || 'circle') : 'circle'
        };
    };

    const getSalonStyle = (id) => {
        const salon = salones.find(s => s.id === id);
        return {
            name: salon ? salon.nombre : 'Sin Salón',
            color: salon ? (salon.color || 'blue') : 'blue',
            icono: salon ? (salon.icon || salon.icono || 'circle') : 'circle'
        };
    };

    return (
        <Box overflowX="auto" bg="white" p={4} borderRadius="xl" boxShadow="sm">
            <Grid templateColumns="80px repeat(7, 1fr)" gap={1} minW="1000px">
                {/* Header Row */}
                <GridItem>
                    <Box h="40px" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="xs" fontWeight="bold" color="gray.500">HORA</Text>
                    </Box>
                </GridItem>
                {weekDates.map(({ dayName, label, dateString }) => (
                    <GridItem key={dateString}>
                        <Box h="40px" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg="gray.50" borderRadius="md">
                            <Text fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase">{dayName}</Text>
                            <Text fontSize="xs" color="gray.500">{label}</Text>
                        </Box>
                    </GridItem>
                ))}

                {/* Time Slots */}
                {HOURS.map(hour => (
                    <React.Fragment key={hour}>
                        {/* Time Label */}
                        <GridItem>
                            <Box h="100px" display="flex" alignItems="start" justifyContent="center" pt={2}>
                                <Text fontSize="sm" color="gray.500" fontWeight="medium">{`${hour}:00`}</Text>
                            </Box>
                        </GridItem>

                        {/* Day Slots for this Hour */}
                        {weekDates.map(({ dayName, dateString }) => {
                            const classesInSlot = getSlotClasses(dayName, hour, dateString);
                            const isSelected = selectedDay === dayName && selectedHour === hour;

                            return (
                                <GridItem key={`${dateString}-${hour}`}>
                                    <Box
                                        h="100px"
                                        bg={isSelected ? 'brand.50' : 'gray.50'}
                                        border="1px solid"
                                        borderColor={isSelected ? 'brand.200' : 'gray.100'}
                                        borderRadius="md"
                                        _hover={{ bg: 'brand.50', borderColor: 'brand.300' }}
                                        onClick={() => onSlotClick(dateString, hour, null, dayName)} // Click empty space to add
                                        transition="all 0.2s"
                                        position="relative"
                                        p={2}
                                        cursor="pointer"
                                        overflowY="auto"
                                        className="custom-scrollbar"
                                    >
                                        {classesInSlot.length > 1 && (
                                            <Flex
                                                position="absolute"
                                                top="1px"
                                                right="1px"
                                                bg="red.500"
                                                color="white"
                                                borderRadius="full"
                                                w="18px"
                                                h="18px"
                                                fontSize="10px"
                                                fontWeight="bold"
                                                alignItems="center"
                                                justifyContent="center"
                                                zIndex={20}
                                                boxShadow="sm"
                                            >
                                                {classesInSlot.length}
                                            </Flex>
                                        )}
                                        <VStack spacing={1} align="stretch" h="100%">
                                            {classesInSlot.map((clase, idx) => {
                                                const salonStyle = getSalonStyle(clase.id_salon);
                                                const materiaInfo = getMateriaInfo(clase.id_materia);
                                                const prof = profesores.find(p => p.id_usuario === clase.id_profesor);
                                                return (
                                                    <Tooltip key={`${clase.id}-${idx}`} label={`${materiaInfo.nombre} con ${getProfesorName(clase.id_profesor)} - ${salonStyle.name}`} hasArrow>
                                                        <Box
                                                            bg="white"
                                                            p={2}
                                                            borderRadius="md"
                                                            boxShadow="md"
                                                            borderLeft="4px solid"
                                                            borderLeftColor={`${materiaInfo.color}.400`}
                                                            fontSize="sm"
                                                            cursor="pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent triggering "Add"
                                                                onSlotClick(dateString, hour, clase);
                                                            }}
                                                            _hover={{ bg: `${materiaInfo.color}.50`, transform: 'scale(1.02)' }}
                                                            transition="all 0.2s"
                                                            position="relative"
                                                            borderStyle={clase.rescheduleStatus === 'PENDIENTE' ? 'dashed' : 'solid'}
                                                            borderColor={clase.rescheduleStatus === 'PENDIENTE' ? 'orange.400' : 'transparent'}
                                                        >
                                                            {(clase.isRescheduling || (clase.recalendarizaciones && clase.recalendarizaciones.length > 0)) && (
                                                                <Badge
                                                                    colorScheme={clase.rescheduleStatus === 'PENDIENTE' ? 'orange' : 'purple'}
                                                                    variant="solid"
                                                                    fontSize="0.55rem"
                                                                    position="absolute"
                                                                    top="-6px"
                                                                    right="-6px"
                                                                    borderRadius="full"
                                                                    zIndex={10}
                                                                    px={1.5}
                                                                >
                                                                    {clase.rescheduleStatus === 'PENDIENTE' ? 'Pend' : 'Recal'}
                                                                </Badge>
                                                            )}
                                                            <HStack spacing={2} mb={1.5}>
                                                                {prof?.foto_url ? (
                                                                    <Avatar size="sm" src={prof.foto_url} name={getProfesorName(clase.id_profesor)} />
                                                                ) : (
                                                                    <Box
                                                                        w="24px"
                                                                        h="24px"
                                                                        borderRadius="md"
                                                                        bg={`${materiaInfo.color}.100`}
                                                                        color={`${materiaInfo.color}.600`}
                                                                        display="flex"
                                                                        alignItems="center"
                                                                        justifyContent="center"
                                                                    >
                                                                        {getIconComponent && (
                                                                            <Icon as={getIconComponent(materiaInfo.icono)} fontSize="14px" />
                                                                        )}
                                                                    </Box>
                                                                )}
                                                                <Text fontWeight="bold" noOfLines={1} fontSize="xs">
                                                                    {getProfesorName(clase.id_profesor)}
                                                                </Text>
                                                            </HStack>
                                                            <HStack spacing={2} mb={1}>
                                                                <Box
                                                                    w="18px"
                                                                    h="18px"
                                                                    borderRadius="sm"
                                                                    bg={`${materiaInfo.color}.100`}
                                                                    color={`${materiaInfo.color}.600`}
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    justifyContent="center"
                                                                    flexShrink={0}
                                                                >
                                                                    {getIconComponent && (
                                                                        <Icon as={getIconComponent(materiaInfo.icono)} fontSize="12px" />
                                                                    )}
                                                                </Box>
                                                                <Text fontSize="xs" color="gray.700" noOfLines={1} fontWeight="semibold">
                                                                    {materiaInfo.nombre}
                                                                </Text>
                                                            </HStack>
                                                            <HStack spacing={2}>
                                                                <Box
                                                                    w="18px"
                                                                    h="18px"
                                                                    borderRadius="sm"
                                                                    bg={`${salonStyle.color}.100`}
                                                                    color={`${salonStyle.color}.600`}
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    justifyContent="center"
                                                                    flexShrink={0}
                                                                >
                                                                    {getIconComponent && (
                                                                        <Icon as={getIconComponent(salonStyle.icono)} fontSize="12px" />
                                                                    )}
                                                                </Box>
                                                                <Text fontSize="xs" color={`${salonStyle.color}.700`} fontWeight="bold" noOfLines={1}>
                                                                    {salonStyle.name}
                                                                </Text>
                                                            </HStack>
                                                        </Box>
                                                    </Tooltip>
                                                )
                                            })}
                                        </VStack>
                                    </Box>
                                </GridItem>
                            );
                        })}
                    </React.Fragment>
                ))}
            </Grid>
        </Box>
    );
};

export default WeeklyGrid;
