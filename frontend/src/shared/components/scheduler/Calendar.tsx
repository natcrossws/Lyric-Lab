// @ts-nocheck
import { useState, useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Grid,
  GridItem,
  Badge,
  Tooltip,
  useDisclosure,
  useBreakpointValue,
  Flex,
  Divider,
  List,
  ListItem,
  ListIcon,
  Heading
} from '@chakra-ui/react';
import SharedModal from '@/shared/components/overlays/SharedModal';
import { FiChevronLeft, FiChevronRight, FiClock, FiUser, FiMapPin, FiBook, FiCircle } from 'react-icons/fi';

// cat_dias: 1=Lun, 2=Mar, ..., 7=Dom. JS getDay(): 0=Dom, 1=Lun, ..., 6=Sab
const jsDayToCatDia = (d) => (d === 0 ? 7 : d);

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function getClasesForDay(fecha, clases, recalendarizaciones = []) {
  const d = new Date(fecha);
  d.setHours(12, 0, 0, 0);
  const catDia = jsDayToCatDia(d.getDay());
  const fechaStr = toYMD(d);
  const result = [];

  for (const c of clases || []) {
    const idClase = c.id_clase ?? c.id;
    const fechaInicio = c.fecha_inicio ? new Date(c.fecha_inicio) : null;
    const fechaFin = c.fecha_fin ? new Date(c.fecha_fin) : null;
    if (fechaInicio && d < fechaInicio) continue;
    if (fechaFin && d > fechaFin) continue;
    const fkDia = c.fk_id_cat_dia ?? c.fk_id_cat_dia;
    if (fkDia != null && fkDia !== catDia) continue;

    const rec = (recalendarizaciones || []).find(
      (r) => (r.fk_id_clase ?? r.fkIdClase) === idClase && [1, 2].includes(r.fk_id_estatus_general ?? r.fkIdEstatusGeneral)
    );
    if (rec) {
      const fo = rec.fecha_original ?? rec.fechaOriginal;
      const fn = rec.fecha_nueva ?? rec.fechaNueva;
      if (fo === fechaStr) continue;
      if (fn === fechaStr) {
        result.push({
          ...c,
          _horaInicio: rec.hora_inicio_nueva ?? rec.horaInicioNueva ?? c.hora_inicio,
          _horaFin: rec.hora_fin_nueva ?? rec.horaFinNueva ?? c.hora_fin,
          _salonId: rec.fk_id_salon_nuevo ?? rec.fkIdSalonNuevo ?? c.fk_id_salon,
          _recal: rec
        });
        continue;
      }
    }
    result.push({
      ...c,
      _horaInicio: c.hora_inicio,
      _horaFin: c.hora_fin,
      _salonId: c.fk_id_salon
    });
  }
  result.sort((a, b) => String(a._horaInicio || '').localeCompare(String(b._horaInicio || '')));
  return result;
}

export function getMateriaInfo(clase, materias) {
  const id = clase?.fk_id_cat_materia ?? clase?.materia?.id_cat_materia;
  if (clase?.materia) return clase.materia;
  return (materias || []).find((m) => (m.id_cat_materia ?? m.id) === id) || null;
}

export function getSalonInfo(clase, salones) {
  const id = clase?._salonId ?? clase?.fk_id_salon ?? clase?.salon?.id_salon ?? clase?.salon?.id;
  if (clase?.salon && (clase.salon.id_salon === id || clase.salon.id === id)) return clase.salon;
  return (salones || []).find((s) => (s.id_salon ?? s.id) === id) || null;
}

const NOMBRES_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Calendar({
  clases = [],
  bitacoras = [],
  recalendarizaciones = [],
  alumnos = [],
  materias = [],
  salones = [],
  profesores = [],
  userType = 'admin',
  onCancelReschedule
}) {
  const [view, setView] = useState('mes'); // 'mes' | 'semana'
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dayDetail, setDayDetail] = useState(null);
  const { isOpen: isClassOpen, onOpen: onClassOpen, onClose: onClassClose } = useDisclosure();
  const [selectedClass, setSelectedClass] = useState(null);
  const { isOpen: isRecOpen, onOpen: onRecOpen, onClose: onRecClose } = useDisclosure();
  const [selectedRec, setSelectedRec] = useState(null);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const cellHeight = useBreakpointValue({ base: 80, md: 140 });
  const gridMinH = useBreakpointValue({ base: 480, md: 840 });
  const gridAutoRows = useBreakpointValue({ base: 'minmax(80px, auto)', md: 'minmax(140px, auto)' });

  // Semana actual para vista semana: Dom–Sab
  const weekStart = useMemo(() => {
    const d = new Date(cursor);
    const day = d.getDay();
    const diff = -day; // Start on Sunday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  // Grid mes: primer día mostrado (puede ser de la semana anterior, iniciando en Domingo)
  const monthStart = useMemo(() => {
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const day = d.getDay();
    const diff = -day; // Start on Sunday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [cursor]);

  const monthCells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [monthStart]);

  const handlePrev = () => {
    const d = new Date(cursor);
    if (view === 'mes') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCursor(d);
  };

  const handleNext = () => {
    const d = new Date(cursor);
    if (view === 'mes') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCursor(d);
  };

  const handleCellClick = (date, dayClases) => {
    setDayDetail({ date, dayClases });
    onOpen();
  };

  const handleClassClick = (clase, e) => {
    if (e) e.stopPropagation();
    setSelectedClass(clase);
    onClassOpen();
  };

  const handleRecClick = (rec, e) => {
    if (e) e.stopPropagation();
    setSelectedRec(rec);
    onRecOpen();
  };

  const renderCellContent = (date, isMonthView = true) => {
    const dayClases = getClasesForDay(date, clases, recalendarizaciones);
    const isCurrentMonth = isMonthView && date.getMonth() === cursor.getMonth();
    const isToday = toYMD(date) === toYMD(new Date());

    if (isMobile) {
      const n = dayClases.length;
      const label = n === 0 ? 'Sin clases' : n === 1 ? '1 clase' : `${n} clases`;
      return (
        <Flex
          h="100%"
          flexDir="column"
          align="center"
          justify="center"
          p={1}
          bg={!isCurrentMonth && isMonthView ? 'gray.50' : isToday ? 'brand.50' : 'white'}
          opacity={!isCurrentMonth && isMonthView ? 0.6 : 1}
          onClick={() => handleCellClick(date, dayClases)}
          cursor="pointer"
          _hover={{ bg: 'gray.50' }}
        >
          <Text fontSize="sm" fontWeight={isToday ? 'bold' : 'normal'}>
            {date.getDate()}
          </Text>
          <Tooltip label={label} placement="top">
            <Box
              as="span"
              w="28px"
              h="28px"
              borderRadius="full"
              bg={n === 0 ? 'gray.200' : 'brand.400'}
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              fontWeight="bold"
              mt={1}
            >
              {n}
            </Box>
          </Tooltip>
        </Flex>
      );
    }

    return (
      <Box
        h="100%"
        p={2}
        overflowY="auto"
        bg={!isCurrentMonth && isMonthView ? 'gray.50' : isToday ? 'brand.50' : 'white'}
        opacity={!isCurrentMonth && isMonthView ? 0.6 : 1}
        onClick={() => handleCellClick(date, dayClases)}
        cursor="pointer"
        _hover={{ bg: 'gray.50' }}
      >
        <Text fontSize="sm" fontWeight={isToday ? 'bold' : 'normal'} mb={2}>
          {date.getDate()}
        </Text>
        {(dayClases.slice(0, 2) || []).map((cl) => {
          const mat = getMateriaInfo(cl, materias);
          const hora = typeof cl._horaInicio === 'string' ? cl._horaInicio.slice(0, 5) : (cl._horaInicio || '').toString().slice(0, 5);
          return (
            <Box key={cl.id_clase || cl.id || hora} mb={1} onClick={(e) => handleClassClick(cl, e)}>
              <Badge size="sm" colorScheme={mat?.color || 'gray'} mr={1}>
                {hora}
              </Badge>
              <Text as="span" fontSize="xs" noOfLines={1}>
                {mat?.nombre || 'Clase'}
              </Text>
            </Box>
          );
        })}
        {dayClases.length > 2 && (
          <Text fontSize="xs" color="gray.500">
            +{dayClases.length - 2} más
          </Text>
        )}
      </Box>
    );
  };

  const titulo = view === 'mes'
    ? `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`
    : `Semana del ${weekStart.getDate()} ${MESES[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  return (
    <Box w="100%">
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
        <HStack>
          <Button size="sm" leftIcon={<FiChevronLeft />} onClick={handlePrev} />
          <Heading size="md">{titulo}</Heading>
          <Button size="sm" rightIcon={<FiChevronRight />} onClick={handleNext} />
        </HStack>
        <HStack>
          <Button size="sm" colorScheme={view === 'mes' ? 'blue' : 'gray'} variant={view === 'mes' ? 'solid' : 'outline'} onClick={() => setView('mes')}>
            Mes
          </Button>
          <Button size="sm" colorScheme={view === 'semana' ? 'blue' : 'gray'} variant={view === 'semana' ? 'solid' : 'outline'} onClick={() => setView('semana')}>
            Semana
          </Button>
        </HStack>
      </Flex>

      {view === 'mes' && (
        <Grid
          templateColumns="repeat(7, 1fr)"
          minH={`${gridMinH}px`}
          gridAutoRows={gridAutoRows}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          w="100%"
        >
          {NOMBRES_DIA.map((n) => (
            <GridItem key={n} bg="gray.100" p={2} textAlign="center" fontWeight="bold" fontSize="sm">
              {n}
            </GridItem>
          ))}
          {monthCells.map((d) => (
            <GridItem key={d.getTime()} borderTopWidth="1px" borderLeftWidth="1px" borderColor="gray.200">
              {renderCellContent(d, true)}
            </GridItem>
          ))}
        </Grid>
      )}

      {view === 'semana' && (
        <Grid
          templateColumns="repeat(7, 1fr)"
          minH={`${gridMinH}px`}
          gridAutoRows={gridAutoRows}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
          w="100%"
        >
          {weekDays.map((w) => (
            <GridItem key={w.getTime()} bg="gray.100" p={2} textAlign="center" fontWeight="bold" fontSize="sm">
              {`${NOMBRES_DIA[w.getDay()]} ${w.getDate()}`}
            </GridItem>
          ))}
          {weekDays.map((d) => (
            <GridItem key={d.getTime()} borderTopWidth="1px" borderLeftWidth="1px" borderColor="gray.200">
              {renderCellContent(d, false)}
            </GridItem>
          ))}
        </Grid>
      )}

      <SharedModal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        title={
          dayDetail?.date
            ? new Date(dayDetail.date).toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Detalle'
        }
        hideDefaultFooter
        motionPreset={"scale" as any}
      >
        {dayDetail?.dayClases?.length ? (
          <List spacing={2}>
            {dayDetail.dayClases.map((cl) => {
              const mat = getMateriaInfo(cl, materias);
              const salon = getSalonInfo(cl, salones);
              const hora = (typeof cl._horaInicio === 'string' ? cl._horaInicio.slice(0, 5) : '').toString();
              return (
                <ListItem
                  key={cl.id_clase || cl.id}
                  p={2}
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => {
                    onClose();
                    handleClassClick(cl);
                  }}
                >
                  <HStack>
                    <ListIcon as={FiClock} color="brand.500" />
                    <Text fontWeight="bold">{hora}</Text>
                    <Badge colorScheme={mat?.color || 'gray'}>{mat?.nombre || 'Clase'}</Badge>
                  </HStack>
                  {salon && (
                    <Text fontSize="sm" color="gray.600" ml={6}>
                      <FiMapPin style={{ display: 'inline', marginRight: 4 }} />
                      {salon.nombre}
                    </Text>
                  )}
                  {(userType === 'admin' || userType === 'profesor') && cl.profesor && (
                    <Text fontSize="sm" color="gray.600" ml={6}>
                      <FiUser style={{ display: 'inline', marginRight: 4 }} />
                      {cl.profesor.nombre}
                    </Text>
                  )}
                  {cl.alumno && (userType === 'admin' || userType === 'profesor') && (
                    <Text fontSize="sm" color="gray.600" ml={6}>
                      Alumno: {cl.alumno.nombre}
                    </Text>
                  )}
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Text color="gray.500">Sin clases este día.</Text>
        )}
      </SharedModal>

      <SharedModal isOpen={isClassOpen} onClose={onClassClose} size="lg" title="Detalle de clase" hideDefaultFooter>
        {selectedClass && (
          <VStack align="stretch" spacing={3}>
            <HStack>
              <FiClock />
              <Text>
                {typeof selectedClass._horaInicio === 'string' ? selectedClass._horaInicio.slice(0, 5) : ''} –{' '}
                {typeof selectedClass._horaFin === 'string' ? selectedClass._horaFin.slice(0, 5) : ''}
              </Text>
            </HStack>
            <HStack>
              <FiBook />
              <Text>{getMateriaInfo(selectedClass, materias)?.nombre || 'Clase'}</Text>
            </HStack>
            <HStack>
              <FiMapPin />
              <Text>{getSalonInfo(selectedClass, salones)?.nombre || '—'}</Text>
            </HStack>
            {(userType === 'admin' || userType === 'profesor') && selectedClass.profesor && (
              <HStack>
                <FiUser />
                <Text>Prof. {selectedClass.profesor.nombre}</Text>
              </HStack>
            )}
            {selectedClass.alumno && (
              <HStack>
                <FiUser />
                <Text>Alumno: {selectedClass.alumno.nombre}</Text>
              </HStack>
            )}
            {selectedClass._recal && (
              <Box mt={2}>
                <Badge colorScheme="orange">Recalendarización pendiente</Badge>
                {onCancelReschedule && userType === 'admin' && (
                  <Button
                    size="sm"
                    ml={2}
                    colorScheme="red"
                    variant="outline"
                    onClick={() => {
                      onCancelReschedule(selectedClass._recal.id_recalendarizacion ?? selectedClass._recal.id);
                      onClassClose();
                    }}
                  >
                    Rechazar
                  </Button>
                )}
              </Box>
            )}
            <Divider />
            <Heading size="sm">Bitácoras</Heading>
            {(() => {
              const bits = (bitacoras || []).filter(
                (b) => (b.fk_id_clase ?? b.fkIdClase) === (selectedClass.id_clase ?? selectedClass.id)
              );
              if (bits.length === 0) return <Text color="gray.500">No hay bitácoras.</Text>;
              return (
                <List spacing={2}>
                  {bits.map((b) => (
                    <ListItem key={b.id_bitacora ?? b.id} fontSize="sm">
                      {b.fecha ? new Date(b.fecha).toLocaleDateString() : ''} –{' '}
                      {b.objetivo?.slice(0, 80) || 'Sin objetivo'}
                    </ListItem>
                  ))}
                </List>
              );
            })()}
          </VStack>
        )}
      </SharedModal>

      <SharedModal isOpen={isRecOpen} onClose={onRecClose} size="md" title="Recalendarización" hideDefaultFooter>
        {selectedRec && (
          <VStack align="stretch">
            <Text>
              Original: {selectedRec.fecha_original ?? selectedRec.fechaOriginal} → Nueva:{' '}
              {selectedRec.fecha_nueva ?? selectedRec.fechaNueva}
            </Text>
            <Text>Motivo: {(selectedRec.motivo_solicitud ?? selectedRec.motivoSolicitud) || '—'}</Text>
            {onCancelReschedule && userType === 'admin' && (
              <Button
                size="sm"
                colorScheme="red"
                onClick={() => {
                  onCancelReschedule(selectedRec.id_recalendarizacion ?? selectedRec.id);
                  onRecClose();
                }}
              >
                Rechazar solicitud
              </Button>
            )}
          </VStack>
        )}
      </SharedModal>
    </Box>
  );
}
