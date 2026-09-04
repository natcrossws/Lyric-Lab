// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Input,
    VStack,
    HStack,
    Text,
    Tag,
    TagLabel,
    TagCloseButton,
    List,
    ListItem,
    Avatar,
    InputGroup,
    InputLeftElement,
    FormControl,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    useOutsideClick,
    useColorModeValue,
    Select,
    SimpleGrid,
    Checkbox,
    Spinner,
    Center
} from '@chakra-ui/react';
import { FaSearch, FaUserPlus, FaFilter } from 'react-icons/fa';
import api from '@/shared/services/api';

const RecipientSelector = ({
    tipoUsuario,
    selectedRecipients,
    onSelectionChange,
    mode,
    onModeChange,
    filters,
    onFiltersChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [loading, setLoading] = useState(true);
    const selectRef = useRef(null);
    const listRef = useRef(null);

    const bgList = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useOutsideClick({
        ref: selectRef,
        handler: () => setIsResultsOpen(false),
    });

    // Fetch users based on tipoUsuario
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let rol = '';
                if (tipoUsuario === 'profesores') rol = 'PROFESOR';
                else if (tipoUsuario === 'padres') rol = 'PADRE';
                else if (tipoUsuario === 'alumnos') rol = 'ALUMNO';

                if (rol) {
                    const { data } = await api.get(`/usuarios?rol=${rol}`);
                    const mappedUsers = data.map(u => ({
                        id: u.id_usuario,
                        nombre: u.nombre,
                        email: u.email,
                        avatar: u.foto_url || ''
                    }));
                    setUsers(mappedUsers);
                }

                // Fetch materias for filters
                const { data: materiasData } = await api.get('/materias');
                setMaterias(materiasData.map(m => ({
                    id: m.id_cat_materia,
                    nombre: m.nombre
                })));

                // Fetch profesores for filters (if needed)
                if (tipoUsuario === 'alumnos' || tipoUsuario === 'padres') {
                    const { data: profesoresData } = await api.get('/usuarios?rol=PROFESOR');
                    setProfesores(profesoresData.map(p => ({
                        id: p.id_usuario,
                        nombre: p.nombre
                    })));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tipoUsuario]);

    useEffect(() => {
        if (searchTerm.trim().length > 0 && users.length > 0) {
            const filtered = users.filter(user =>
                !selectedRecipients.find(r => r.id === user.id) && // Exclude already selected
                (user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setSearchResults(filtered);
            setIsResultsOpen(true);
        } else {
            setSearchResults([]);
            setIsResultsOpen(false);
        }
    }, [searchTerm, users, selectedRecipients]);

    const handleSelectUser = (user) => {
        onSelectionChange([...selectedRecipients, user]);
        setSearchTerm('');
        setIsResultsOpen(false);
    };

    const handleRemoveUser = (userId) => {
        onSelectionChange(selectedRecipients.filter(u => u.id !== userId));
    };

    const handleFilterChange = (field, value) => {
        onFiltersChange({ ...filters, [field]: value });
    };

    return (
        <VStack align="stretch" spacing={4}>
            <FormControl>
                <FormLabel fontWeight="600" color="gray.600">Alcance del Envío</FormLabel>
                <RadioGroup onChange={onModeChange} value={mode}>
                    <Stack direction={{ base: 'column', md: 'row' }} spacing={5}>
                        <Radio value="masivo" colorScheme="brand">
                            <Text fontWeight={mode === 'masivo' ? 'bold' : 'normal'}>
                                Envío Masivo (Todos)
                            </Text>
                        </Radio>
                        <Radio value="filtro" colorScheme="brand">
                            <Text fontWeight={mode === 'filtro' ? 'bold' : 'normal'}>
                                Por Grupo/Filtro
                            </Text>
                        </Radio>
                        <Radio value="particular" colorScheme="brand">
                            <Text fontWeight={mode === 'particular' ? 'bold' : 'normal'}>
                                Particular (Selección manual)
                            </Text>
                        </Radio>
                    </Stack>
                </RadioGroup>
            </FormControl>

            {/* MODO FILTRO */}
            {mode === 'filtro' && (
                <Box
                    p={4}
                    ref={listRef} maxH="250px" overflowY="auto" borderRadius="md"
                    bg="brand.50"
                    border="1px dashed"
                    borderColor="brand.200"
                >
                    <VStack align="stretch" spacing={3}>
                        <HStack color="brand.600" fontWeight="bold" fontSize="sm">
                            <FaFilter />
                            <Text>Configurar Filtros</Text>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl>
                                <FormLabel fontSize="sm">Materia / Actividad</FormLabel>
                                <Select
                                    bg="white"
                                    size="sm"
                                    placeholder="Todas las materias"
                                    value={filters?.materia || ''}
                                    onChange={(e) => handleFilterChange('materia', e.target.value)}
                                    isDisabled={loading}
                                >
                                    {materias.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </Select>
                            </FormControl>

                            {(tipoUsuario === 'alumnos' || tipoUsuario === 'padres') && (
                                <FormControl>
                                    <FormLabel fontSize="sm">Profesor Asignado</FormLabel>
                                    <Select
                                        bg="white"
                                        size="sm"
                                        placeholder="Todos los profesores"
                                        value={filters?.profesor || ''}
                                        onChange={(e) => handleFilterChange('profesor', e.target.value)}
                                        isDisabled={loading}
                                    >
                                        {profesores.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <FormControl>
                                <FormLabel fontSize="sm">Semana / Fecha de Clase</FormLabel>
                                <Input
                                    type="week"
                                    bg="white"
                                    size="sm"
                                    value={filters?.semana || ''}
                                    onChange={(e) => handleFilterChange('semana', e.target.value)}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" mt={6}>
                                <Checkbox
                                    colorScheme="brand"
                                    isChecked={filters?.soloActivos}
                                    onChange={(e) => handleFilterChange('soloActivos', e.target.checked)}
                                >
                                    <Text fontSize="sm">Solo usuarios activos</Text>
                                </Checkbox>
                            </FormControl>
                        </SimpleGrid>

                        <Text fontSize="xs" color="gray.500" mt={2}>
                            * Se enviará a todos los {tipoUsuario} que coincidan con <strong>todos</strong> los filtros seleccionados.
                        </Text>
                    </VStack>
                </Box>
            )}

            {/* MODO PARTICULAR */}
            {mode === 'particular' && (
                <Box position="relative" ref={searchRef}>
                    {loading ? (
                        <Center py={8}>
                            <Spinner size="lg" color="brand.500" />
                        </Center>
                    ) : (
                        <>
                            <InputGroup size="md" mb={2}>
                                <InputLeftElement pointerEvents="none">
                                    <FaSearch color="gray.300" />
                                </InputLeftElement>
                                <Input
                                    placeholder={`Buscar ${tipoUsuario} por nombre o correo...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => searchTerm.length > 0 && setIsResultsOpen(true)}
                                    bg="white"
                                />
                            </InputGroup>

                    {/* Search Results Dropdown */}
                    {isResultsOpen && searchResults.length > 0 && (
                        <List
                            position="absolute"
                            top="100%"
                            left={0}
                            right={0}
                            zIndex={10}
                            bg={bgList}
                            boxShadow="lg"
                            borderRadius="md"
                            border="1px solid"
                            borderColor={borderColor}
                            maxH="200px"
                            overflowY="auto"
                        >
                            {searchResults.map((user) => (
                                <ListItem
                                    key={user.id}
                                    p={3}
                                    cursor="pointer"
                                    _hover={{ bg: 'brand.50' }}
                                    onClick={() => handleSelectUser(user)}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                >
                                    <HStack>
                                        <Avatar size="xs" name={user.nombre} src={user.avatar} />
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="sm" fontWeight="bold">{user.nombre}</Text>
                                            <Text fontSize="xs" color="gray.500">{user.email}</Text>
                                        </VStack>
                                        <Box flex={1} />
                                        <FaUserPlus color="gray.400" />
                                    </HStack>
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {/* Selected Recipients Tags */}
                    <Box
                        minH="50px"
                        p={2}
                        border="1px dashed"
                        borderColor="gray.300"
                        borderRadius="md"
                        bg="gray.50"
                    >
                        {selectedRecipients.length === 0 ? (
                            <Text fontSize="sm" color="gray.400" textAlign="center" py={2}>
                                No hay destinatarios seleccionados
                            </Text>
                        ) : (
                            <HStack spacing={2} wrap="wrap">
                                {selectedRecipients.map((user) => (
                                    <Tag
                                        key={user.id}
                                        size="md"
                                        borderRadius="full"
                                        variant="solid"
                                        colorScheme="brand"
                                        mb={1}
                                    >
                                        <Avatar
                                            src={user.avatar}
                                            size="xs"
                                            name={user.nombre}
                                            ml={-1}
                                            mr={2}
                                        />
                                        <TagLabel>{user.nombre}</TagLabel>
                                        <TagCloseButton onClick={() => handleRemoveUser(user.id)} />
                                    </Tag>
                                ))}
                            </HStack>
                        )}
                    </Box>
                            <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                                {selectedRecipients.length} destinatarios seleccionados
                            </Text>
                        </>
                    )}
                </Box>
            )}
        </VStack>
    );
};

export default RecipientSelector;
