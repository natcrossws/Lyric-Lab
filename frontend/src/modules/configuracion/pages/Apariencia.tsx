import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  useToast,
  Divider,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import AdminPageShell from "@/shared/components/layout/AdminPageShell";
import AnimatedBackground from "@/shared/components/layout/AnimatedBackground";
import { useInstitution } from "@/core/context/InstitutionContext";
import { useAuth } from "@/core/context/AuthContext";
import { applyDynamicTheme } from "@/core/theme/dynamicTheme";
import api from "@/shared/services/api";
import { FiSave, FiRefreshCcw } from "react-icons/fi";

// Import FilePond and plugins
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(FilePondPluginImagePreview);

// Filepond server config will be generated dynamically inside the component

const GlassCard = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => (
  <Box
    bg="white"
    borderRadius="2xl"
    border="1px solid"
    borderColor="gray.100"
    boxShadow="sm"
    p={6}
    w="full"
  >
    <Heading size="md" mb={4} color="gray.800">
      {title}
    </Heading>
    {children}
  </Box>
);

export default function Apariencia() {
  const { institution, setInstitution } = useInstitution();
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();
  
  const phonePreviewPlateBg = useColorModeValue(
    "rgba(255, 255, 255, 0.7)",
    "rgba(0,0,0,0.5)"
  );
  const phonePreviewPlateBorder = useColorModeValue(
    "1px solid rgba(255,255,255,0.6)",
    "1px solid rgba(255,255,255,0.1)"
  );

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    primaryColor: "#3182CE",
    secondaryColor: "#2B6CB0",
    backgroundColor: "#ebebeb",
    textColor: "#1a202c",
    logoUrl: "",
    institutionName: "",
    loginBackgroundUrl: "",
    loginBackgroundType: "waves",
    loginPrimaryColor: "",
    loginSecondaryColor: "",
    loginBackgroundColor: "",
  });

  const [filePondServer, setFilePondServer] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const instId = localStorage.getItem('activeInstitutionId');
    const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'https://localhost:3000/api');
    
    setFilePondServer({
      url: `${baseURL}/upload`,
      process: {
        url: "",
        method: "POST" as const,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-institution-id': instId || ''
        }
      },
      revert: {
        url: "",
        method: "DELETE" as const,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-institution-id': instId || ''
        }
      }
    });
  }, []);

  useEffect(() => {
    if (institution && institution.theme) {
      const safePrimary = institution.theme.primaryColor && institution.theme.primaryColor.includes('var(') 
        ? "#3182CE" 
        : institution.theme.primaryColor || "#3182CE";

      setFormData({
        primaryColor: safePrimary,
        secondaryColor: institution.theme.secondaryColor || "#2B6CB0",
        backgroundColor: institution.theme.backgroundColor || "#ebebeb",
        textColor: institution.theme.textColor || "#1a202c",
        logoUrl: institution.logo || "",
        institutionName: institution.nombre || "",
        loginBackgroundUrl: institution.theme.loginBackgroundUrl || "",
        loginBackgroundType: institution.theme.loginBackgroundType || "waves",
        loginPrimaryColor: institution.theme.loginPrimaryColor || "",
        loginSecondaryColor: institution.theme.loginSecondaryColor || "",
        loginBackgroundColor: institution.theme.loginBackgroundColor || "",
      });
    }
  }, [institution]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put("/general/institucion/apariencia", {
        nombre: formData.institutionName,
        logoBase64: formData.logoUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        loginBackgroundUrl: formData.loginBackgroundUrl,
        loginBackgroundType: formData.loginBackgroundType,
        loginPrimaryColor: formData.loginPrimaryColor,
        loginSecondaryColor: formData.loginSecondaryColor,
        loginBackgroundColor: formData.loginBackgroundColor,
      });

      if (res.data.success) {
        toast({
          title: "Configuración guardada",
          description: "Los cambios de branding se han aplicado visualmente.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });

        // Update local context
        const newTheme = {
          ...institution.theme,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
          loginBackgroundUrl: formData.loginBackgroundUrl,
          loginBackgroundType: formData.loginBackgroundType,
          loginPrimaryColor: formData.loginPrimaryColor,
          loginSecondaryColor: formData.loginSecondaryColor,
          loginBackgroundColor: formData.loginBackgroundColor,
        };

        setInstitution((prev: any) => ({
          ...prev,
          nombre: formData.institutionName,
          logo: formData.logoUrl,
          theme: newTheme
        }));

        if (user && user.myInstitutions) {
          const updatedInstitutions = user.myInstitutions.map((inst: any) => {
            if (inst.id === institution.id) {
              return {
                ...inst,
                nombre: formData.institutionName,
                logo: formData.logoUrl,
                theme: newTheme
              };
            }
            return inst;
          });
          updateLocalUser({ myInstitutions: updatedInstitutions });
        }

        applyDynamicTheme({
          primaryColorHex: formData.primaryColor,
          secondaryColorHex: formData.secondaryColor,
          tertiaryColorHex: formData.secondaryColor,
          backgroundColorHex: formData.backgroundColor,
          textColorHex: formData.textColor
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al guardar",
        status: "error",
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    setFormData({
      ...formData,
      primaryColor: "#0284c7",
      secondaryColor: "#0369a1",
      backgroundColor: "#f8fafc",
      textColor: "#1a202c",
      loginBackgroundType: "waves",
      loginPrimaryColor: "#0284c7",
      loginSecondaryColor: "#0369a1",
      loginBackgroundColor: "#0f172a",
    });
    toast({
      title: "Valores por defecto cargados",
      description: "Haz clic en 'Guardar Cambios' para aplicar.",
      status: "info",
      duration: 3000,
      position: "top-right",
    });
  };

  // Prevent runtime crashes when AnimatedBackground runs during SSR or invalid config
  const animatedType = formData.loginBackgroundType as any;

  return (
    <AdminPageShell
      title="Personalización Global"
      description="Configura la identidad visual, logotipos y paleta de colores del sistema."
      actions={
        <HStack spacing={3} w="full" flexWrap="wrap" justify="flex-end">
          <Button
            leftIcon={<FiRefreshCcw />}
            variant="ghost"
            onClick={handleRestore}
            isDisabled={loading}
          >
            Restaurar Valores
          </Button>
          <Button
            leftIcon={<FiSave />}
            colorScheme="brand"
            isLoading={loading}
            onClick={handleSave}
            boxShadow="md"
          >
            Guardar Cambios
          </Button>
        </HStack>
      }
    >
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
        <VStack spacing={6}>
          <GlassCard title="Paleta de Colores">
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Color Primario
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    w="60px"
                    p={1}
                    name="primaryColor"
                    value={formData.primaryColor || "#000000"}
                    onChange={handleChange}
                  />
                  <Input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor || ""}
                    onChange={handleChange}
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Color Secundario (Hover/Activo)
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    w="60px"
                    p={1}
                    name="secondaryColor"
                    value={formData.secondaryColor || "#000000"}
                    onChange={handleChange}
                  />
                  <Input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor || ""}
                    onChange={handleChange}
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Color de Fondo General
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    w="60px"
                    p={1}
                    name="backgroundColor"
                    value={formData.backgroundColor || "#ffffff"}
                    onChange={handleChange}
                  />
                  <Input
                    type="text"
                    name="backgroundColor"
                    value={formData.backgroundColor || ""}
                    onChange={handleChange}
                  />
                </HStack>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Color de Texto Base
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    w="60px"
                    p={1}
                    name="textColor"
                    value={formData.textColor || "#000000"}
                    onChange={handleChange}
                  />
                  <Input
                    type="text"
                    name="textColor"
                    value={formData.textColor || ""}
                    onChange={handleChange}
                  />
                </HStack>
              </FormControl>
            </VStack>
          </GlassCard>

          <GlassCard title="Marca corporativa">
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Nombre de la Institución
                </FormLabel>
                <Input
                  type="text"
                  name="institutionName"
                  value={formData.institutionName || ""}
                  onChange={handleChange}
                  placeholder="Ej. Gobierno de..."
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Logotipo Institucional (Barra lateral / Login)
                </FormLabel>
                <FilePond
                  server={filePondServer}
                  name="file"
                  labelIdle='Arrastra y suelta tu Logotipo o <span class="filepond--label-action">Explora</span>'
                  onprocessfile={async (error, file) => {
                    if (error || !file.serverId) return;
                    // The server returns a path or base64. 
                    // In the template project, it expects a base64 via the put, or an ID if FilePond saves it.
                    // We assume it returns an ID/URL. 
                    setFormData((prev) => ({
                      ...prev,
                      logoUrl: file.serverId,
                    }));
                  }}
                />
                {formData.logoUrl && (
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    Logo actual configurado o cargado.
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Estilo de Fondo (Login)
                </FormLabel>
                <Select
                  name="loginBackgroundType"
                  value={formData.loginBackgroundType || "waves"}
                  onChange={handleChange}
                  bg="white"
                >
                  <option value="waves">Ondas Expansivas (Animado)</option>
                  <option value="particles">Partículas Flotantes (Animado)</option>
                  <option value="gradient">Gradiente Dinámico (Animado)</option>
                  <option value="aurora">Aurora Boreal (Animado)</option>
                  <option value="grid">Cyber Grid (Animado)</option>
                  <option value="pulse">Anillos Circulares (Animado)</option>
                  <option value="legacy">Formas Clásicas (Animado)</option>
                  <option value="image">Fondo Fotográfico (Imagen)</option>
                </Select>
              </FormControl>

              <FormControl mt={4}>
                <FormLabel fontSize="sm" color="gray.500">
                  Color Primario del Login
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    w="60px"
                    p={1}
                    name="loginPrimaryColor"
                    value={formData.loginPrimaryColor || formData.primaryColor || "#000"}
                    onChange={handleChange}
                  />
                  <Input
                    type="text"
                    name="loginPrimaryColor"
                    value={formData.loginPrimaryColor || formData.primaryColor || ""}
                    onChange={handleChange}
                  />
                </HStack>
              </FormControl>
              <FormControl mt={2}>
                <FormLabel fontSize="sm" color="gray.500">
                  Color Secundario del Login
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    w="60px"
                    p={1}
                    name="loginSecondaryColor"
                    value={formData.loginSecondaryColor || formData.secondaryColor || "#000"}
                    onChange={handleChange}
                  />
                  <Input
                    type="text"
                    name="loginSecondaryColor"
                    value={formData.loginSecondaryColor || formData.secondaryColor || ""}
                    onChange={handleChange}
                  />
                </HStack>
              </FormControl>
              <FormControl mt={2}>
                <FormLabel fontSize="sm" color="gray.500">
                  Color de Fondo del Login
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    w="60px"
                    p={1}
                    name="loginBackgroundColor"
                    value={formData.loginBackgroundColor || formData.backgroundColor || "#000"}
                    onChange={handleChange}
                  />
                  <Input
                    type="text"
                    name="loginBackgroundColor"
                    value={formData.loginBackgroundColor || formData.backgroundColor || ""}
                    onChange={handleChange}
                  />
                </HStack>
              </FormControl>

              {formData.loginBackgroundType === "image" && (
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.500">
                    Subir Imagen de Fondo
                  </FormLabel>
                  <FilePond
                    server={filePondServer}
                    name="file"
                    labelIdle='Arrastra y suelta un Fondo o <span class="filepond--label-action">Explora</span>'
                    onprocessfile={async (error, file) => {
                      if (error || !file.serverId) return;
                      setFormData((prev) => ({
                        ...prev,
                        loginBackgroundUrl: file.serverId,
                      }));
                    }}
                  />
                  {formData.loginBackgroundUrl && (
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      Fondo actual configurado.
                    </Text>
                  )}
                </FormControl>
              )}

              <FormControl mt={2}>
                <FormLabel fontSize="sm" color="gray.500">
                  Previsualización del Fondo
                </FormLabel>
                <Box
                  position="relative"
                  w="full"
                  h="250px"
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="inset 0 4px 10px rgba(0,0,0,0.1)"
                  bg="gray.900"
                >
                  <AnimatedBackground
                    type={animatedType || "waves"}
                    primaryColor={formData.loginPrimaryColor || formData.primaryColor}
                    secondaryColor={formData.loginSecondaryColor || formData.secondaryColor}
                    backgroundColor={formData.loginBackgroundColor || formData.backgroundColor}
                    imageUrl={formData.loginBackgroundUrl}
                  />
                  <Box
                    position="absolute"
                    inset={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box
                      w="140px"
                      h="160px"
                      bg={phonePreviewPlateBg}
                      backdropFilter="blur(16px)"
                      borderRadius="xl"
                      border={phonePreviewPlateBorder}
                      boxShadow="0 10px 30px rgba(0,0,0,0.1)"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      p={3}
                    >
                        <Text fontSize="xs" fontWeight="bold" textAlign="center" color="gray.800">Login Window</Text>
                        <Box w="80%" h="4px" bg="gray.300" borderRadius="full" mt={3} />
                        <Box w="60%" h="4px" bg="gray.300" borderRadius="full" mt={2} />
                        <Box w="100%" h="24px" bg="brand.500" borderRadius="md" mt={4} />
                    </Box>
                  </Box>
                </Box>
              </FormControl>
            </VStack>
          </GlassCard>
        </VStack>

        <VStack spacing={6}>
          <GlassCard title="Previsualización de Componentes">
            <VStack spacing={6} align="stretch">
              <Box
                p={4}
                borderRadius="lg"
                bg={formData.backgroundColor || "#F8FAFC"}
              >
                <Text fontSize="sm" color="gray.500" mb={3}>
                  Fondo General
                </Text>

                <Box
                  p={4}
                  bg="white"
                  borderRadius="md"
                  boxShadow="sm"
                >
                  <Heading
                    size="sm"
                    mb={2}
                    color={formData.textColor || "#1a202c"}
                  >
                    {formData.institutionName || "Nombre de la Institución"}
                  </Heading>
                  <Text fontSize="xs" color="gray.500" mb={4}>
                    Ejemplo de texto base sobre tarjeta blanca para verificar contraste.
                  </Text>

                  <HStack>
                    <Button
                      size="sm"
                      bg={formData.primaryColor || "brand.500"}
                      color="white"
                      _hover={{ bg: formData.secondaryColor }}
                    >
                      Acción Principal
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      color={formData.primaryColor}
                      borderColor={formData.primaryColor}
                    >
                      Secundario
                    </Button>
                  </HStack>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Aplicar Cambios
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Al pulsar guardar se inyectarán las variables CSS de entorno
                  de inmediato en toda la aplicación para personalizar Sidebar,
                  Botones, Tablas y Modales.
                </Text>
              </Box>
            </VStack>
          </GlassCard>
        </VStack>
      </SimpleGrid>
    </AdminPageShell>
  );
}
