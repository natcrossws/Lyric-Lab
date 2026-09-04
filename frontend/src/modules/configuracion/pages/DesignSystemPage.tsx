import React from "react";
import {
  Box,
  Button,
  Flex,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Switch,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Select,
  Textarea,
  Badge,
  Avatar,
  AvatarGroup,
  Spinner,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiUser, FiMail, FiUploadCloud } from "react-icons/fi";
import AdminPageShell, { AdminMainPanel } from "@/shared/components/layout/AdminPageShell";
import ShowcaseGlassCard from "@/shared/components/ui/ShowcaseGlassCard";
import DataTable from "@/shared/components/ui/DataTable";
import FilterSection from "@/shared/components/ui/FilterSection";
import { BiEnvelope, BiPencil, BiUserMinus } from "react-icons/bi";
import { Card, CardBody, CardFooter } from "@chakra-ui/react";

export default function DesignSystemPage() {
  const dsTabListBg = useColorModeValue(
    "rgba(255,255,255,0.8)",
    "rgba(0,0,0,0.1)"
  );
  
  const dsTabListBorder = useColorModeValue(
    "1px solid rgba(var(--brand-rgb), 0.2)",
    "1px solid rgba(255,255,255,0.1)"
  );

  return (
    <AdminPageShell
      title="UI Showcase & Design System"
      instruction="Catálogo"
      description="Componentes base alineados a la paleta dinámica del sistema. Toda la UI está purgada de colores hardcodeados y reacciona a las variables de tema global."
    >
      <Tabs variant="soft-rounded" colorScheme="brand" mt={2} isFitted>
        <TabList
          bg={dsTabListBg}
          backdropFilter="blur(12px) saturate(150%)"
          p={1.5}
          borderRadius="2xl"
          boxShadow="sm"
          mb={8}
          border={dsTabListBorder}
        >
          <Tab
            borderRadius="xl"
            fontWeight="600"
            fontSize="sm"
            _selected={{
              bgGradient: "linear(135deg, brand.500, brand.600)",
              color: "white",
              boxShadow: "0 6px 18px rgba(var(--brand-rgb), 0.32)",
            }}
            transition="all 0.3s"
          >
            1. Átomos
          </Tab>
          <Tab
            borderRadius="xl"
            fontWeight="600"
            fontSize="sm"
            _selected={{
              bgGradient: "linear(135deg, brand.500, brand.600)",
              color: "white",
              boxShadow: "0 6px 18px rgba(var(--brand-rgb), 0.32)",
            }}
            transition="all 0.3s"
          >
            2. Formularios
          </Tab>
          <Tab
            borderRadius="xl"
            fontWeight="600"
            fontSize="sm"
            _selected={{
              bgGradient: "linear(135deg, brand.500, brand.600)",
              color: "white",
              boxShadow: "0 6px 18px rgba(var(--brand-rgb), 0.32)",
            }}
            transition="all 0.3s"
          >
            3. Layouts & Estructuras
          </Tab>
        </TabList>

        <TabPanels>
          {/* TAB 1: ÁTOMOS */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
              <ShowcaseGlassCard
                title="Botones (Buttons)"
                subtitle="Diferentes estados, materiales y jerarquías usando la paleta dinámica."
              >
                <HStack spacing={4} wrap="wrap">
                  <Button
                    colorScheme="brand"
                    borderRadius="xl"
                    _hover={{ transform: "scale(1.05)" }}
                    _active={{ transform: "scale(0.95)" }}
                    transition="all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    boxShadow="0 8px 20px -5px rgba(var(--brand-rgb), 0.45)"
                  >
                    Primary
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="brand"
                    borderRadius="xl"
                    _hover={{ transform: "scale(1.05)" }}
                    _active={{ transform: "scale(0.95)" }}
                  >
                    Outline
                  </Button>
                  <Button
                    variant="ghost"
                    colorScheme="gray"
                    borderRadius="xl"
                  >
                    Ghost
                  </Button>
                  <Button
                    colorScheme="secondary"
                    borderRadius="xl"
                    _hover={{ transform: "scale(1.05)" }}
                    _active={{ transform: "scale(0.95)" }}
                  >
                    Secondary
                  </Button>
                  <Button
                    isLoading
                    colorScheme="brand"
                    borderRadius="xl"
                  >
                    Cargando
                  </Button>
                </HStack>
              </ShowcaseGlassCard>

              <ShowcaseGlassCard
                title="Badges & Chips"
                subtitle="Indicadores elegantes con alto contraste."
              >
                <HStack spacing={4} wrap="wrap">
                  <Badge
                    bg="rgba(var(--brand-rgb), 0.12)"
                    color="brand.600"
                    px={4}
                    py={1.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="700"
                    border="1px solid rgba(var(--brand-rgb), 0.22)"
                  >
                    En revisión
                  </Badge>
                  <Badge
                    colorScheme="green"
                    px={4}
                    py={1.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="700"
                  >
                    Aprobado
                  </Badge>
                  <Badge
                    colorScheme="red"
                    px={4}
                    py={1.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="700"
                  >
                    Rechazado
                  </Badge>
                  <Badge
                    bg="white"
                    color="gray.600"
                    px={4}
                    py={1.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="700"
                    border="1px solid"
                    borderColor="gray.200"
                    boxShadow="sm"
                  >
                    Borrador
                  </Badge>
                </HStack>
              </ShowcaseGlassCard>

              <ShowcaseGlassCard
                title="Avatares & Spinners"
                subtitle="Elementos visuales y de carga."
              >
                <HStack spacing={10}>
                  <AvatarGroup size="md" max={3}>
                    <Avatar name="Fernando" />
                    <Avatar name="Claudia" />
                    <Avatar name="Andrés" />
                    <Avatar name="Marcelo" />
                  </AvatarGroup>
                  <Spinner
                    color="brand.500"
                    size="md"
                    thickness="3px"
                    speed="0.8s"
                  />
                  <Progress
                    size="xs"
                    isIndeterminate
                    colorScheme="brand"
                    w="120px"
                    borderRadius="full"
                  />
                </HStack>
              </ShowcaseGlassCard>

              <ShowcaseGlassCard
                title="Controles Lógicos"
                subtitle="Switches & Checks redondeados y suaves."
              >
                <HStack spacing={10}>
                  <Box>
                    <FormLabel fontSize="sm" color="gray.500" mb={2} fontWeight="600">
                      Toggle
                    </FormLabel>
                    <Switch colorScheme="brand" size="lg" defaultChecked />
                  </Box>
                  <Box>
                    <FormLabel fontSize="sm" color="gray.500" mb={2} fontWeight="600">
                      Consentimiento
                    </FormLabel>
                    <Checkbox colorScheme="brand" size="lg" defaultChecked />
                  </Box>
                  <Box>
                    <FormLabel fontSize="sm" color="gray.500" mb={2} fontWeight="600">
                      Rol
                    </FormLabel>
                    <RadioGroup defaultValue="1">
                      <Stack direction="row" spacing={4}>
                        <Radio value="1" colorScheme="brand">User</Radio>
                        <Radio value="2" colorScheme="brand">Admin</Radio>
                      </Stack>
                    </RadioGroup>
                  </Box>
                </HStack>
              </ShowcaseGlassCard>
            </SimpleGrid>
          </TabPanel>

          {/* TAB 2: FORMULARIOS */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
              <ShowcaseGlassCard
                title="Inputs (Text & Select)"
                subtitle="Diseño limpio, inspirado en iOS, con focus states vibrantes al brand."
              >
                <VStack spacing={5}>
                  <FormControl>
                    <FormLabel
                      fontSize="xs"
                      color="gray.600"
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="widest"
                      ml={1}
                    >
                      Nombre Completo
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none" color="gray.400" mt={1} ml={1}>
                        <FiUser />
                      </InputLeftElement>
                      <Input
                        placeholder="Ej. Juan Pérez"
                        size="lg"
                        borderRadius="2xl"
                        bg="rgba(255,255,255,0.8)"
                        border="1px solid"
                        borderColor="rgba(0,0,0,0.06)"
                        boxShadow="inset 0 2px 4px rgba(0,0,0,0.02)"
                        _hover={{ borderColor: "rgba(0,0,0,0.15)", bg: "white" }}
                        _focus={{
                          borderColor: "brand.500",
                          boxShadow: "0 0 0 1px var(--chakra-colors-brand-500), 0 4px 14px rgba(var(--brand-rgb), 0.22)",
                          bg: "white",
                        }}
                        transition="all 0.2s"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel
                      fontSize="xs"
                      color="gray.600"
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="widest"
                      ml={1}
                    >
                      Dependencia
                    </FormLabel>
                    <Select
                      size="lg"
                      borderRadius="2xl"
                      bg="rgba(255,255,255,0.8)"
                      borderColor="rgba(0,0,0,0.06)"
                      boxShadow="inset 0 2px 4px rgba(0,0,0,0.02)"
                      _hover={{ borderColor: "rgba(0,0,0,0.15)", bg: "white" }}
                      _focus={{
                        borderColor: "brand.500",
                        boxShadow: "0 0 0 1px var(--chakra-colors-brand-500), 0 4px 14px rgba(var(--brand-rgb), 0.22)",
                        bg: "white",
                      }}
                      transition="all 0.2s"
                    >
                      <option>Sede Principal</option>
                      <option>Sede Norte</option>
                    </Select>
                  </FormControl>
                </VStack>
              </ShowcaseGlassCard>

              <ShowcaseGlassCard
                title="Áreas y Cargas"
                subtitle="Ingreso de datos complejos y gestión documental."
              >
                <VStack spacing={5}>
                  <FormControl>
                    <FormLabel
                      fontSize="xs"
                      color="gray.600"
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="widest"
                      ml={1}
                    >
                      Descripción del Trámite
                    </FormLabel>
                    <Textarea
                      placeholder="Escribe aquí los detalles de la solicitud..."
                      borderRadius="2xl"
                      bg="rgba(255,255,255,0.8)"
                      border="1px solid"
                      borderColor="rgba(0,0,0,0.06)"
                      boxShadow="inset 0 2px 4px rgba(0,0,0,0.02)"
                      _hover={{ borderColor: "rgba(0,0,0,0.15)", bg: "white" }}
                      _focus={{
                        borderColor: "brand.500",
                        boxShadow: "0 0 0 1px var(--chakra-colors-brand-500), 0 4px 14px rgba(var(--brand-rgb), 0.22)",
                        bg: "white",
                      }}
                      rows={4}
                      transition="all 0.2s"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel
                      fontSize="xs"
                      color="gray.600"
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="widest"
                      ml={1}
                    >
                      Carga Documental (Drag & Drop)
                    </FormLabel>
                    <Box
                      border="2px dashed"
                      borderColor="rgba(var(--brand-rgb), 0.3)"
                      borderRadius="2xl"
                      p={8}
                      textAlign="center"
                      bg="rgba(255,255,255,0.5)"
                      _hover={{
                        bg: "rgba(255,255,255,0.9)",
                        borderColor: "brand.500",
                        transform: "scale(1.02)",
                        boxShadow: "0 10px 25px rgba(var(--brand-rgb), 0.1)",
                      }}
                      cursor="pointer"
                      transition="all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    >
                      <VStack spacing={3}>
                        <Box
                          p={3}
                          bg="white"
                          borderRadius="full"
                          boxShadow="0 4px 15px rgba(0,0,0,0.05)"
                        >
                          <FiUploadCloud size={24} color="var(--chakra-colors-brand-500)" />
                        </Box>
                        <Text fontSize="sm" fontWeight="700" color="gray.700">
                          Arrastra documentos aquí o navega
                        </Text>
                      </VStack>
                    </Box>
                  </FormControl>
                </VStack>
              </ShowcaseGlassCard>
            </SimpleGrid>
          </TabPanel>

          {/* TAB 3: ESTRUCTURAS COMPLEJAS (DATATABLE Y FILTROS) */}
          <TabPanel px={0}>
            {/* CARDS */}
            <ShowcaseGlassCard
              title="Tarjetas de Entidad (Cards)"
              subtitle="Ejemplo de la tarjeta de usuario utilizada en los listados tipo Grid, con indicadores de estado y gradientes de la paleta dinámica."
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} mb={8}>
                <Card
                  borderRadius="3xl"
                  bg="white"
                  boxShadow="xl"
                  _hover={{
                    transform: 'translateY(-10px)',
                    boxShadow: '2xl',
                    borderColor: 'brand.400'
                  }}
                  transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  border="1px solid"
                  borderColor="transparent"
                  position="relative"
                  overflow="visible"
                >
                  {/* Status Indicator (Glowing Dot) */}
                  <Box
                    position="absolute"
                    top={5}
                    right={5}
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg="green.400"
                    boxShadow="0 0 10px var(--chakra-colors-green-400)"
                    zIndex={2}
                  />

                  {/* Gradient Top Accent */}
                  <Box
                    h="6px"
                    w="60%"
                    mx="auto"
                    mt="-1px"
                    bgGradient="linear(to-r, brand.400, secondary.400)"
                    borderBottomRadius="full"
                  />

                  <CardBody textAlign="center" pt={8} pb={4}>
                    <Flex justify="center" mb={5} position="relative">
                      {/* Avatar Container with Ring */}
                      <Box
                        p="3px"
                        borderRadius="full"
                        bgGradient="linear(to-br, brand.400, secondary.400)"
                        boxShadow="lg"
                      >
                        <Avatar
                          size="2xl"
                          name="Juan Pérez"
                          border="4px solid white"
                        />
                      </Box>
                    </Flex>

                    <VStack spacing={1} mb={6}>
                      <Heading size="md" color="gray.800" fontWeight="800" letterSpacing="tight" noOfLines={1}>
                        Juan Pérez
                      </Heading>
                      <Text fontSize="sm" color="gray.500" fontWeight="500" noOfLines={1}>
                        juan.perez@ejemplo.com
                      </Text>
                      <Badge
                        colorScheme="purple"
                        variant="subtle"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        mt={2}
                      >
                        Administrador
                      </Badge>
                    </VStack>

                    {/* Stats Grid */}
                    <SimpleGrid columns={2} spacing={3} mb={2}>
                      <Box bg="gray.50" p={2} borderRadius="xl">
                        <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" fontWeight="bold">Teléfono</Text>
                        <Text fontWeight="700" color="brand.600" fontSize="xs" isTruncated>
                          555-1234
                        </Text>
                      </Box>
                      <Box bg="gray.50" p={2} borderRadius="xl">
                        <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" fontWeight="bold">Rol</Text>
                        <Text fontWeight="700" color="brand.600" fontSize="xs" isTruncated>
                          Admin
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>

                  <CardFooter p={4} pt={0}>
                    <VStack w="100%" spacing={3}>
                      <Button
                          size="sm"
                          variant="solid"
                          colorScheme="purple"
                          width="full"
                          leftIcon={<BiEnvelope />}
                          boxShadow="sm"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                       >
                          Reenviar Pass
                       </Button>
                       <HStack w="100%" spacing={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="brand"
                            flex={1}
                            leftIcon={<BiPencil />}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            flex={1}
                            leftIcon={<BiUserMinus />}
                          >
                            Baja
                          </Button>
                       </HStack>
                    </VStack>
                  </CardFooter>
                </Card>
              </SimpleGrid>
            </ShowcaseGlassCard>

            <Box mt={8} mb={8}>
              <Text fontSize="lg" fontWeight="bold" color="gray.700" mb={2}>
                Regla de Maquetación de Pantallas
              </Text>
              <Text fontSize="sm" color="gray.600" mb={6}>
                Toda pantalla del sistema debe estar compuesta por 3 bloques fundamentales, todos separados e independientes, para mantener una interfaz limpia e iluminada:
              </Text>

              {/* 1. Cabecera */}
              <Box mb={6} position="relative">
                <Badge position="absolute" top="-3" left="4" colorScheme="blue" zIndex="1" px={2} py={1} borderRadius="md" boxShadow="sm">
                  1. AdminPageShell (Título y Botón de Acción)
                </Badge>
                <Box border="2px dashed" borderColor="blue.300" borderRadius="3xl" p={2}>
                  <AdminPageShell
                    title="Ejemplo de Título"
                    description="El título de cada pantalla va siempre en un AdminPageShell."
                    titleAside={
                      <Button colorScheme="brand" size="sm">Acción Principal</Button>
                    }
                    mb={0}
                  />
                </Box>
              </Box>

              {/* 2. Filtros */}
              <Box mb={6} position="relative">
                <Badge position="absolute" top="-3" left="4" colorScheme="purple" zIndex="1" px={2} py={1} borderRadius="md" boxShadow="sm">
                  2. AdminMainPanel (Sección de Filtros Independiente)
                </Badge>
                <Box border="2px dashed" borderColor="purple.300" borderRadius="3xl" p={2}>
                  <AdminMainPanel mb={0} compact>
                    <Text fontSize="sm" color="gray.600" mb={3} fontWeight="500">
                      Instrucciones sobre qué hace este bloque de filtros. Los filtros SIEMPRE van en su propio contenedor blanco independiente.
                    </Text>
                    <FilterSection
                      fields={[
                        { key: "q", type: "text", placeholder: "Buscar usuario...", value: "", onChange: () => {} },
                        { key: "status", type: "select", placeholder: "Estado", value: "", options: [{ label: "Activo", value: "1" }], onChange: () => {} },
                      ]}
                      onSearch={() => alert("Buscando...")}
                    />
                  </AdminMainPanel>
                </Box>
              </Box>

              {/* 3. Tabla / Contenido */}
              <Box position="relative">
                <Badge position="absolute" top="-3" left="4" colorScheme="green" zIndex="1" px={2} py={1} borderRadius="md" boxShadow="sm">
                  3. AdminMainPanel (Contenedor de Tabla/DataGrid)
                </Badge>
                <Box border="2px dashed" borderColor="green.300" borderRadius="3xl" p={2}>
                  <AdminMainPanel mb={0}>
                    <Text fontSize="sm" color="gray.600" mb={4} fontWeight="500">
                      Si usas una tabla debajo de los filtros, esta DEBE estar envuelta en otro `AdminMainPanel` (o dentro de Cards con el mismo estilo blanco).
                    </Text>
                    <DataTable
                      data={[
                        { id: 1, name: "Fernando", role: "Admin", status: "Activo" },
                        { id: 2, name: "Usuario Prueba", role: "User", status: "Inactivo" },
                      ]}
                      columns={[
                        { key: "id", header: "ID" },
                        { key: "name", header: "Nombre" },
                        {
                          key: "status",
                          header: "Estado",
                          render: (item: any) => (
                            <Badge colorScheme={item.status === 'Activo' ? 'green' : 'red'}>{item.status}</Badge>
                          )
                        },
                      ]}
                    />
                  </AdminMainPanel>
                </Box>
              </Box>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </AdminPageShell>
  );
}
