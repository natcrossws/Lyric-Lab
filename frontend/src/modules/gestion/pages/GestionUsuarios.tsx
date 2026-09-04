// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import api from '@/shared/services/api';
import {
  Box,
  Heading,
  Button,
  useDisclosure,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Select,
  useToast,
  Flex,
  HStack,
  IconButton,
  Icon,
  Text,
  Avatar,
  Grid,
  GridItem,
  VStack,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  SimpleGrid,
  Card,
  CardBody,
  CardFooter,
  Tag,
  Divider,
  Badge,
  Textarea,
  Spinner,
  Switch
} from '@chakra-ui/react';
import {
  BiPencil,
  BiTrash,
  BiShow,
  BiPlus,
  BiUserMinus,
  BiUser,
  BiPhone,
  BiEnvelope,
  BiMoney,
  BiDownload,
  BiGridAlt,
  BiCheckCircle,
  BiLockAlt
} from 'react-icons/bi';
import AdminPageShell, { AdminMainPanel } from '@/shared/components/layout/AdminPageShell';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import * as XLSX from 'xlsx';
import SharedModal from '@/shared/components/overlays/SharedModal';
import { estadosMexico } from '@/shared/constants/states';
import { getStorageItem } from '@/shared/utils/storage';
import { sanitizeCpMexicoDigits, isCpMexicoCompleto } from '@/shared/utils/codigoPostalMexico';

registerPlugin(FilePondPluginImagePreview);

/** Etiquetas por id_cat_tipo_usuario (cat_tipos_usuario) */
const TIPO_USUARIO_LABEL = {
  1: 'Administrador',
  2: 'Profesor',
  3: 'Padre / Tutor',
  4: 'Alumno',
  5: 'Administrador institucional',
  6: 'Administrador global'
};

// Definir mapeo de roles (Front -> Back ID)
const ROLE_MAP = {
  admin: 1,
  profesor: 2,
  alumno: 4,
  padre: 3,
  global_admin: 6,
  institution_admin: 5
};
const ROLE_ID_TO_NAME = {
  1: 'admin',
  2: 'profesor',
  3: 'padre',
  4: 'alumno',
  5: 'institution_admin',
  6: 'GLOBAL_ADMIN'
};

/** Normaliza `usuarios.direccion` (API / lista) al shape del formulario. */
function mapUsuarioToFormDireccion(u) {
  const d = u?.direccion;
  if (!d) {
    return {
      estado: '',
      municipio: '',
      cp: '',
      colonia: '',
      calle: '',
      numero: '',
      pais: '1'
    };
  }
  return {
    calle: d.calle || '',
    numero: d.numero_exterior || '',
    cp: d.cp != null ? String(d.cp) : '',
    colonia: d.colonia || '',
    municipio: d.municipioObj?.municipio || d.municipio_texto || '',
    estado: d.estadoObj?.estado || d.estado_texto || '',
    pais: d.fk_id_cat_pais != null ? String(d.fk_id_cat_pais) : '1'
  };
}

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isBajaOpen, onOpen: onBajaOpen, onClose: onBajaClose } = useDisclosure();
  const { isOpen: isResendOpen, onOpen: onResendOpen, onClose: onResendClose } = useDisclosure();
  const [usuarioParaBaja, setUsuarioParaBaja] = useState(null);
  const [usuarioParaReenviar, setUsuarioParaReenviar] = useState(null);
  const cancelRef = useRef<any>(null);
  const toast = useToast();
  const [filtros, setFiltros] = useState({
    busqueda: '',
    rol: ''
  });

  const actor = getStorageItem('user');
  const isGlobalAdmin =
    actor?.role === 'GLOBAL_ADMIN' || Number(actor?.id_rol) === 6;
  const canManagePermisos =
    isGlobalAdmin ||
    actor?.role === 'INSTITUTION_ADMIN' ||
    actor?.role === 'ADMIN' ||
    Number(actor?.id_rol) === 1 ||
    Number(actor?.id_rol) === 5;

  const [permisosProfileGroups, setPermisosProfileGroups] = useState([]);
  const [selectedSubmoduleIds, setSelectedSubmoduleIds] = useState([]);
  const [permisosLoading, setPermisosLoading] = useState(false);
  const [asignacionLibre, setAsignacionLibre] = useState(false);

  /** Ítems del portal que aplica al usuario (editables en el modal). */
  const permisosTotalesCount = permisosProfileGroups.reduce((n, g) => {
    if (!g.editable) return n;
    return (
      n +
      (g.modules || []).reduce((nn, mod) => nn + (mod.items || []).length, 0)
    );
  }, 0);

  // Estados del Formulario
  const [formData, setFormData] = useState({
    nombre_pila: '',
    ap_paterno: '',
    ap_materno: '',
    email: '',
    telefono: '',
    curp: '',
    password: '',
    rol: 'institution_admin',
    direccion: {
      estado: '',
      municipio: '',
      cp: '',
      colonia: '',
      calle: '',
      numero: '',
      pais: '1'
    }
  });
  const [files, setFiles] = useState([]);
  const [municipiosDisponibles, setMunicipiosDisponibles] = useState([]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/usuarios');
      // Mapear los datos para que coincidan con la estructura esperada
      const mapped = data.map((u) => ({
        ...u,
        rol_nombre:
          TIPO_USUARIO_LABEL[u.fk_id_cat_tipo_usuario] ||
          ROLE_ID_TO_NAME[u.fk_id_cat_tipo_usuario] ||
          'Desconocido',
        direccion: mapUsuarioToFormDireccion(u)
      }));
      setUsuarios(mapped);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error cargando usuarios', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    if (!isEditOpen || !usuarioEditando || !canManagePermisos) {
      if (!isEditOpen) {
        setPermisosProfileGroups([]);
        setSelectedSubmoduleIds([]);
        setAsignacionLibre(false);
      }
      return undefined;
    }
    let cancelled = false;
    setPermisosLoading(true);
    api
      .get(`/usuarios/${usuarioEditando.id_usuario}/permisos-submodulos`)
      .then((res) => {
        if (cancelled || !res.data?.success) return;
        setAsignacionLibre(!!res.data.asignacion_libre);
        const pg = res.data.profile_groups;
        if (Array.isArray(pg) && pg.length > 0) {
          setPermisosProfileGroups(pg);
          const sel = [];
          for (const g of pg) {
            if (!g.editable) continue;
            for (const m of g.modules || []) {
              for (const it of m.items || []) {
                if (it.asignado) sel.push(it.id_submodulo);
              }
            }
          }
          setSelectedSubmoduleIds(sel);
        } else {
          const mods = res.data.modules || [];
          setPermisosProfileGroups([
            {
              key: 'legacy',
              etiqueta: 'Menú',
              prefijo: res.data.prefijo_rutas || '',
              editable: true,
              modules: mods
            }
          ]);
          const sel = [];
          for (const m of mods) {
            for (const it of m.items || []) {
              if (it.asignado) sel.push(it.id_submodulo);
            }
          }
          setSelectedSubmoduleIds(sel);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPermisosProfileGroups([]);
          setSelectedSubmoduleIds([]);
          toast({
            title: 'No se pudieron cargar los permisos del menú',
            status: 'warning',
            duration: 4000,
            isClosable: true
          });
        }
      })
      .finally(() => {
        if (!cancelled) setPermisosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEditOpen, usuarioEditando?.id_usuario, canManagePermisos]);

  useEffect(() => {
    if (formData.direccion?.estado) {
      const estadoObj = estadosMexico.find(e => e.nombre === formData.direccion.estado);
      setMunicipiosDisponibles(estadoObj ? estadoObj.municipios : []);
    } else {
      setMunicipiosDisponibles([]);
    }
  }, [formData.direccion?.estado]);

  const closeModal = () => {
    setPermisosProfileGroups([]);
    setSelectedSubmoduleIds([]);
    setAsignacionLibre(false);
    onClose();
    onEditClose();
  };

  /** Portal del usuario + (plan o asignación libre para administradores). */
  const puedeEditarPermisoItem = (profile, item) =>
    profile.editable && (asignacionLibre || item.en_plan === true);

  const togglePermisoSubmodulo = (id, editable, enPlanOk = true) => {
    if (!editable || enPlanOk === false) return;
    setSelectedSubmoduleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const collectEditableSubmoduleIds = () => {
    const ids = [];
    for (const g of permisosProfileGroups) {
      if (!g.editable) continue;
      for (const m of g.modules || []) {
        for (const it of m.items || []) {
          if (puedeEditarPermisoItem(g, it)) ids.push(it.id_submodulo);
        }
      }
    }
    return ids;
  };

  const marcarTodosPermisos = () => setSelectedSubmoduleIds(collectEditableSubmoduleIds());
  const desmarcarTodosPermisos = () => setSelectedSubmoduleIds([]);

  const handleCrear = () => {
    setUsuarioEditando(null);
    setPermisosProfileGroups([]);
    setSelectedSubmoduleIds([]);
    setFormData({
      nombre_pila: '',
      ap_paterno: '',
      ap_materno: '',
      email: '',
      telefono: '',
      curp: '',
      password: '',
      rol: 'institution_admin',
      direccion: {
        estado: '',
        municipio: '',
        cp: '',
        colonia: '',
        calle: '',
        numero: '',
        pais: '1'
      }
    });
    setFiles([]);
    onOpen();
  };

  const handleEditar = async (usuario) => {
    let source = usuario;
    try {
      const { data } = await api.get(`/usuarios/${usuario.id_usuario}`);
      source = { ...usuario, ...data };
    } catch (err) {
      console.warn(err);
      toast({
        title: 'Detalle incompleto',
        description: 'Se muestran los datos de la lista; la dirección puede estar desactualizada.',
        status: 'warning',
        duration: 4000,
        isClosable: true
      });
    }

    setUsuarioEditando(source);

    const dir = mapUsuarioToFormDireccion(source);

    // Split name
    const nombreCompleto = source.nombre || '';
    const parts = nombreCompleto.split(' ');
    let nombre = '', paterno = '', materno = '';

    if (parts.length === 1) {
      nombre = parts[0];
    } else if (parts.length === 2) {
      nombre = parts[0];
      paterno = parts[1];
    } else if (parts.length >= 3) {
      materno = parts[parts.length - 1];
      paterno = parts[parts.length - 2];
      nombre = parts.slice(0, parts.length - 2).join(' ');
    }

    setFormData({
      nombre_pila: nombre,
      ap_paterno: paterno,
      ap_materno: materno,
      email: source.email,
      telefono: source.telefono || '',
      curp: source.curp || '',
      rol: ROLE_ID_TO_NAME[source.fk_id_cat_tipo_usuario] || '',
      direccion: dir
    });

    // Handle Photo logic (similar to others)
    if (source.foto_base64) {
       try {
         const base64toFile = (base64, filename, mimeType) => {
           const byteCharacters = atob(base64.split(',')[1]);
           const byteNumbers = new Array(byteCharacters.length);
           for (let i = 0; i < byteCharacters.length; i++) {
             byteNumbers[i] = byteCharacters.charCodeAt(i);
           }
           const byteArray = new Uint8Array(byteNumbers);
           const blob = new Blob([byteArray], { type: mimeType });
           return new File([blob], filename, { type: mimeType });
         };

         const mimeType = source.foto_base64.split(';')[0].split(':')[1];
         const file = base64toFile(source.foto_base64, `foto_perfil.png`, mimeType);
         setFiles([file]);
       } catch (error) {
         setFiles([]);
       }
    } else {
        setFiles([]);
    }

    onEditOpen();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClickBaja = (usuario) => {
    setUsuarioParaBaja(usuario);
    onBajaOpen();
  };

  /** cat_cp → cat_estados / cat_municipios vía GET /catalogos/cp/:cp */
  const lookupCpSepomex = async (rawCp, { notify = true } = {}) => {
    const digits = sanitizeCpMexicoDigits(rawCp);
    if (digits.length !== 5) return false;
    try {
      const { data } = await api.get(`/catalogos/cp/${digits}`);
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          direccion: {
            ...prev.direccion,
            cp: digits,
            estado: data.estado || '',
            municipio: data.municipio || '',
            pais: prev.direccion.pais || '1'
          }
        }));
        if (notify) {
          toast({
            title: 'Ubicación encontrada',
            description: `${data.municipio}, ${data.estado}`,
            status: 'success',
            duration: 2000,
            isClosable: true
          });
        }
        return true;
      }
    } catch (err) {
      if (notify && err.response?.status !== 404) {
        toast({
          title: 'Código postal',
          description: 'No se pudo consultar el catálogo. Intenta de nuevo.',
          status: 'warning',
          duration: 2500,
          isClosable: true
        });
      }
    }
    return false;
  };

  const handleCpChange = (e) => {
    const digits = sanitizeCpMexicoDigits(e.target.value);
    setFormData((prev) => ({
      ...prev,
      direccion: { ...prev.direccion, cp: digits }
    }));
    if (digits.length === 5) {
      lookupCpSepomex(digits, { notify: true });
    }
  };

  const handleCpBlur = (e) => {
    lookupCpSepomex(e.target.value, { notify: false });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    // -- Validaciones Frontend --
    const { nombre_pila, ap_paterno, ap_materno, email, curp, telefono } = formData;
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // 1. Validar Nombres
    if (!nameRegex.test(nombre_pila) || !nameRegex.test(ap_paterno) || (ap_materno && !nameRegex.test(ap_materno))) {
        toast({
            title: 'Error de validación',
            description: 'El nombre y apellidos solo deben contener letras.',
            status: 'warning',
            duration: 3000,
            isClosable: true
        });
        return;
    }

    // 2. Validar Email
    if (!emailRegex.test(email)) {
        toast({
            title: 'Error de validación',
            description: 'El formato del correo electrónico no es válido.',
            status: 'warning',
            duration: 3000,
            isClosable: true
        });
        return;
    }

    // 3. Validar CURP (Opcional, pero si existe validarlo)
    if (curp && (curp.length < 18 || curp.length > 20)) {
        toast({
            title: 'Error de validación',
            description: 'El CURP debe tener entre 18 y 20 caracteres.',
            status: 'warning',
            duration: 3000,
            isClosable: true
        });
        return;
    }

    const cpDigits = sanitizeCpMexicoDigits(formData.direccion?.cp);
    if (cpDigits.length > 0 && !isCpMexicoCompleto(cpDigits)) {
      toast({
        title: 'Error de validación',
        description: 'El código postal debe ser exactamente 5 dígitos (solo números).',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    /* 
    // Optional: Validar Telefono (e.g. 10 digits)
    const phoneClean = telefono.replace(/\D/g, ''); 
    if (telefono && phoneClean.length < 10) {
        toast({ title: 'Error', description: 'El teléfono parece incompleto.', status: 'warning' });
        return;
    }
    */

    try {
      const fullName = `${formData.nombre_pila} ${formData.ap_paterno} ${formData.ap_materno}`.trim();
      
      const data = new FormData();
      data.append('nombre', fullName);
      data.append('telefono', formData.telefono);
      data.append('curp', formData.curp);
      
      // Address
      if (formData.direccion) {
        data.append('direccion[estado]', formData.direccion.estado || '');
        data.append('direccion[municipio]', formData.direccion.municipio || '');
        data.append('direccion[calle]', formData.direccion.calle || '');
        data.append('direccion[numero]', formData.direccion.numero || '');
        data.append('direccion[colonia]', formData.direccion.colonia || '');
        data.append('direccion[cp]', formData.direccion.cp || '');
        data.append('direccion[pais]', formData.direccion.pais || '1');
      }

      // Role mapping (clave en minúsculas: institution_admin → id 5)
      const rolKey = String(formData.rol || '').toLowerCase();
      const roleId = ROLE_MAP[rolKey];
      if (roleId) data.append('fk_id_cat_tipo_usuario', roleId);

      // Photo
      if (files.length > 0 && files[0].file) {
        data.append('foto', files[0].file);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (usuarioEditando) {
        // UPDATE - Include email if it changed
        if (formData.email && formData.email !== usuarioEditando.email) {
          data.append('email', formData.email);
        }
        await api.put(`/usuarios/${usuarioEditando.id_usuario}`, data, config);
        let permisosOk = true;
        if (canManagePermisos) {
          try {
            await api.put(`/usuarios/${usuarioEditando.id_usuario}/permisos-submodulos`, {
              id_submodulos: selectedSubmoduleIds
            });
          } catch (permErr) {
            console.error(permErr);
            permisosOk = false;
          }
        }
        toast(
          permisosOk
            ? { title: 'Usuario actualizado', status: 'success' }
            : {
                title: 'Usuario actualizado',
                description:
                  'Los datos se guardaron, pero no se pudieron actualizar los permisos del menú.',
                status: 'warning',
                duration: 5000,
                isClosable: true
              }
        );
      } else {
        // CREATE
        data.append('email', formData.email);
        data.append('password', formData.password || '123456'); // Default pass logic
        await api.post('/usuarios', data, config);
        toast({ title: 'Usuario creado', status: 'success' });
      }
      fetchUsuarios();
      closeModal();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Verifica los datos';
      toast({ title: 'Error al guardar', description: msg, status: 'error' });
    }
  };

  const handleResendPassword = (usuario) => {
    setUsuarioParaReenviar(usuario);
    onResendOpen();
  };

  const handleConfirmarResendPassword = async () => {
    try {
      if (!usuarioParaReenviar) return;
      
      await api.post(`/usuarios/${usuarioParaReenviar.id_usuario}/resend-password`);
      toast({
        title: 'Contraseña enviada',
        description: `Se ha enviado una nueva contraseña al correo ${usuarioParaReenviar.email}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al reenviar contraseña',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
    onResendClose();
    setUsuarioParaReenviar(null);
  };

  const handleConfirmarBaja = async () => {
    // ... (existing baja logic)
    try {
      if (usuarioParaBaja) {
        await api.delete(`/usuarios/${usuarioParaBaja.id_usuario}`);
        toast({ title: 'Usuario dado de baja', status: 'success' });
        fetchUsuarios();
      }
    } catch (error) {
      toast({ title: 'Error al dar de baja', status: 'error' });
    }
    onBajaClose();
    setUsuarioParaBaja(null);
  };

  // ... (handleGuardar, etc)

  return (
    <>
      <Box>

        {/* ── Cabecera homogénea ─────────────────────────────────────────── */}
        <AdminPageShell
          icon={BiUser}
          title="Gestión de usuarios"
          description="Administra los usuarios del sistema, sus roles y accesos."
          titleAside={(
            <Button
              leftIcon={<Icon as={BiPlus} />}
              onClick={handleCrear}
              px={6}
              h="42px"
              borderRadius="full"
              colorScheme="brand"
            >
              Nuevo usuario
            </Button>
          )}
        />

        {/* ── Filters Container ───────────────────────────────────────── */}
        <AdminMainPanel mb={6} compact>
          <Text fontSize="sm" color="gray.600" mb={3} fontWeight="500">
            Usa los filtros a continuación para buscar usuarios específicos por nombre o rol.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <Input
              placeholder="🔍  Buscar por nombre..."
              bg="rgba(255,255,255,0.8)"
              border="1px solid rgba(0,0,0,0.08)"
              borderRadius="10px"
              boxShadow="0 1px 4px rgba(0,0,0,0.04)"
              _focus={{
                bg: 'white',
                border: '1.5px solid rgba(var(--brand-rgb), 0.35)',
                boxShadow: '0 0 0 3px rgba(var(--brand-rgb), 0.08)',
              }}
              _hover={{ border: '1px solid rgba(0,0,0,0.14)' }}
              fontSize="13.5px"
              h="40px"
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
            />
            <Select
              placeholder="Filtrar por Rol"
              bg="rgba(255,255,255,0.8)"
              border="1px solid rgba(0,0,0,0.08)"
              borderRadius="10px"
              boxShadow="0 1px 4px rgba(0,0,0,0.04)"
              _focus={{
                bg: 'white',
                border: '1.5px solid rgba(var(--brand-rgb), 0.35)',
                boxShadow: '0 0 0 3px rgba(var(--brand-rgb), 0.08)',
              }}
              fontSize="13.5px"
              h="40px"
              value={filtros.rol}
              onChange={(e) => setFiltros({ ...filtros, rol: e.target.value })}
            >
              <option value="">Todos los roles</option>
              <option value="1">Administrador</option>
              <option value="5">Administrador institucional</option>
              <option value="2">Profesor</option>
              <option value="3">Padre / Tutor</option>
              <option value="4">Alumno</option>
              <option value="6">Administrador global</option>
            </Select>
          </SimpleGrid>
        </AdminMainPanel>

        {/* CARDS GRID */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={8}>
          {usuarios.filter(usuario => {
            const searchLower = filtros.busqueda.toLowerCase();
            const fullName = usuario.nombre ? usuario.nombre.toLowerCase() : '';
            const rolMatch =
              !filtros.rol ||
              String(usuario.fk_id_cat_tipo_usuario) === filtros.rol;
            return fullName.includes(searchLower) && rolMatch;
          }).map((usuario) => (
            <Card
              key={usuario.id_usuario}
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
                bg={usuario.activo ? "green.400" : "red.400"}
                boxShadow={`0 0 10px ${usuario.activo ? "var(--chakra-colors-green-400)" : "var(--chakra-colors-red-400)"}`}
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
                      name={usuario.nombre}
                      src={usuario.foto_base64} // User requested base64 specifically
                      border="4px solid white"
                    />
                  </Box>
                </Flex>

                <VStack spacing={1} mb={6}>
                  <Heading size="md" color="gray.800" fontWeight="800" letterSpacing="tight" noOfLines={1} title={usuario.nombre}>
                    {usuario.nombre}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" fontWeight="500" noOfLines={1} title={usuario.email}>
                    {usuario.email}
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
                    {usuario.rol_nombre}
                  </Badge>
                </VStack>

                {/* Stats Grid */}
                <SimpleGrid columns={2} spacing={3} mb={2}>
                  <Box bg="gray.50" p={2} borderRadius="xl">
                    <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" fontWeight="bold">Teléfono</Text>
                    <Text fontWeight="700" color="brand.600" fontSize="xs" isTruncated>
                      {usuario.telefono || 'N/A'}
                    </Text>
                  </Box>
                  <Box bg="gray.50" p={2} borderRadius="xl">
                    <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" fontWeight="bold">Rol</Text>
                    <Text fontWeight="700" color="brand.600" fontSize="xs" isTruncated>
                      {usuario.rol_nombre || 'N/A'}
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
                      onClick={() => handleResendPassword(usuario)}
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
                        onClick={() => handleEditar(usuario)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        flex={1}
                        leftIcon={<BiUserMinus />}
                        onClick={() => handleClickBaja(usuario)}
                        isDisabled={!usuario.activo}
                      >
                        Baja
                      </Button>
                   </HStack>
                </VStack>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </Box>



      {/* Dialog Reenviar Contraseña */}
      <AlertDialog isOpen={isResendOpen} leastDestructiveRef={cancelRef} onClose={onResendClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.300" backdropFilter="blur(10px)">
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Reenviar Contraseña
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Estás seguro de restablecer y reenviar la contraseña para <strong>{usuarioParaReenviar?.nombre}</strong>?
              <br />
              <Text fontSize="sm" color="gray.500" mt={2}>
                Se generará una nueva contraseña segura y se enviará por correo electrónico.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onResendClose}>Cancelar</Button>
              <Button colorScheme="purple" onClick={handleConfirmarResendPassword} ml={3}>
                Si, Reenviar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <SharedModal
        isOpen={isOpen || isEditOpen}
        onClose={closeModal}
        isCentered
        motionPreset="scale"
        size="6xl"
        title={usuarioEditando ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        hideDefaultFooter
        overlayProps={{ bg: 'blackAlpha.600', backdropFilter: 'blur(4px)' }}
        contentProps={{ borderRadius: '2xl', bg: 'white', boxShadow: '2xl' }}
        formProps={{ onSubmit: handleGuardar }}
        footerProps={{ bg: 'gray.50', borderBottomRadius: '2xl' }}
        footer={(
          <>
            <Button variant="ghost" mr={3} onClick={closeModal}>Cancelar</Button>
            <Button colorScheme="brand" type="submit" px={8} boxShadow="md">Guardar Usuario</Button>
          </>
        )}
        bodyProps={{ p: 8, py: 8 }}
      >
              <Flex gap={8} flexDirection={{ base: 'column', lg: 'row' }}>
                {/* Columna Izquierda: Foto */}
                <Box w={{ base: '100%', lg: '250px' }} flexShrink={0}>
                  <FormLabel textAlign="center" fontWeight="bold" mb={4} color="gray.700">Fotografía</FormLabel>
                  <Box
                    w="220px"
                    h="220px"
                    mx="auto"
                    borderRadius="full"
                    overflow="hidden"
                    boxShadow="lg"
                    bg="gray.50"
                    border="2px solid"
                    borderColor="gray.100"
                  >
                    <FilePond
                      files={files}
                      onupdatefiles={setFiles}
                      allowMultiple={false}
                      maxFiles={1}
                      name="files"
                      labelIdle='<span class="filepond--label-action">Subir Foto</span>'
                      acceptedFileTypes={['image/*']}
                      stylePanelLayout="compact circle"
                    />
                  </Box>
                </Box>

                {/* Columna Derecha: Datos */}
                <Box flex={1}>
                  <VStack spacing={6} align="stretch">
                    {/* Sección Personal */}
                    <Box bg="gray.50" p={5} borderRadius="xl" border="1px solid" borderColor="gray.200">
                      <Heading size="sm" mb={4} color="brand.600" display="flex" alignItems="center">
                        <Icon as={BiPencil} mr={2} /> Información Personal
                      </Heading>
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                        <GridItem colSpan={{ base: 1, md: 2 }}>

                          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                            <FormControl isRequired>
                              <FormLabel fontSize="sm" fontWeight="bold">Nombre(s)</FormLabel>
                              <Input name="nombre_pila" value={formData.nombre_pila} onChange={handleInputChange} placeholder="Ej. Juan" bg="white" />
                            </FormControl>
                            <FormControl isRequired>
                              <FormLabel fontSize="sm" fontWeight="bold">Apellido Paterno</FormLabel>
                              <Input name="ap_paterno" value={formData.ap_paterno} onChange={handleInputChange} placeholder="Ej. Pérez" bg="white" />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm" fontWeight="bold">Apellido Materno</FormLabel>
                              <Input name="ap_materno" value={formData.ap_materno} onChange={handleInputChange} placeholder="Ej. López" bg="white" />
                            </FormControl>
                          </SimpleGrid>
                        </GridItem>
                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="bold">Email</FormLabel>
                            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="correo@ejemplo.com" bg="white" />
                          </FormControl>
                        </GridItem>
                        {/* Tipo de Usuario restricted to Admin only - Hidden or Fixed */}
                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="bold">Tipo de Usuario</FormLabel>
                            <Select
                              name="rol"
                              value={formData.rol}
                              onChange={handleInputChange}
                              bg={usuarioEditando ? 'gray.200' : 'gray.100'}
                              isDisabled={!!usuarioEditando}
                              placeholder="Seleccionar rol"
                            >
                              {!usuarioEditando ? (
                                <option value="institution_admin">
                                  Administrador institucional
                                </option>
                              ) : (
                                <>
                                  <option value="admin">Administrador</option>
                                  <option value="institution_admin">
                                    Administrador institucional
                                  </option>
                                  <option value="GLOBAL_ADMIN">Administrador global</option>
                                  <option value="profesor">Profesor</option>
                                  <option value="padre">Padre / Tutor</option>
                                  <option value="alumno">Alumno</option>
                                </>
                              )}
                            </Select>
                            {usuarioEditando ? (
                              <FormHelperText fontSize="xs" color="gray.600">
                                El tipo de usuario no se puede modificar al editar.
                              </FormHelperText>
                            ) : null}
                          </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">Teléfono</FormLabel>
                            <Input name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="555-555-5555" bg="white" />
                          </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">CURP</FormLabel>
                            <Input name="curp" value={formData.curp} onChange={handleInputChange} placeholder="ABCD123456..." bg="white" />
                          </FormControl>
                        </GridItem>
                        {!usuarioEditando && (
                          <GridItem>
                            <FormControl>
                              <FormLabel fontSize="sm" fontWeight="bold">Contraseña</FormLabel>
                              <Input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Mínimo 6 caracteres" bg="white" />
                            </FormControl>
                          </GridItem>
                        )}
                      </Grid>
                    </Box>

                    {/* Sección Dirección */}
                    <Box bg="gray.50" p={5} borderRadius="xl" border="1px solid" borderColor="gray.200">
                      <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center">
                        <Icon as={BiMoney} mr={2} /> Dirección
                      </Heading>
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                        <GridItem colSpan={{ base: 1, md: 3 }}>
                            <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">C.P.</FormLabel>
                            <Input
                              type="text"
                              name="direccion.cp"
                              value={formData.direccion.cp}
                              onChange={handleCpChange}
                              onBlur={handleCpBlur}
                              placeholder="00000"
                              bg="white"
                              w="150px"
                              inputMode="numeric"
                              autoComplete="postal-code"
                              maxLength={5}
                            />
                            </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">Estado</FormLabel>
                            <Select name="direccion.estado" value={formData.direccion.estado} onChange={handleInputChange} bg="gray.100">
                              <option value="">Seleccionar Estado</option>
                              {estadosMexico.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
                            </Select>
                          </FormControl>
                        </GridItem>
                        <GridItem>
                          <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">Municipio</FormLabel>
                            <Select name="direccion.municipio" value={formData.direccion.municipio} onChange={handleInputChange} bg="gray.100" isDisabled={!municipiosDisponibles.length}>
                              <option value="">Seleccionar Municipio</option>
                              {municipiosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                            </Select>
                          </FormControl>
                        </GridItem>
                        <GridItem>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Colonia</FormLabel>
                                <Input
                                  name="direccion.colonia"
                                  value={formData.direccion.colonia || ''}
                                  onChange={handleInputChange}
                                  placeholder="Colonia"
                                  bg="white"
                                />
                            </FormControl>
                        </GridItem>
                        <GridItem colSpan={{ base: 1, md: 2 }}>
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Calle</FormLabel>
                                <Input name="direccion.calle" value={formData.direccion.calle} onChange={handleInputChange} placeholder="Calle" bg="white" />
                              </FormControl>
                        </GridItem>
                        <GridItem>
                              <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Número Exterior</FormLabel>
                                <Input name="direccion.numero" value={formData.direccion.numero} onChange={handleInputChange} placeholder="Núm. Exterior" bg="white" />
                              </FormControl>
                        </GridItem>
                      </Grid>
                    </Box>

                    {usuarioEditando && canManagePermisos && (
                      <Box
                        position="relative"
                        overflow="hidden"
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor="rgba(0, 128, 128, 0.2)"
                        bg="linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(236, 253, 245, 0.85) 100%)"
                        backdropFilter="blur(12px)"
                        sx={{ WebkitBackdropFilter: 'blur(12px)' }}
                        boxShadow="0 8px 32px rgba(0, 59, 113, 0.06), inset 0 1px 0 rgba(255,255,255,0.9)"
                        p={{ base: 4, md: 5 }}
                      >
                        <Box
                          position="absolute"
                          top="-24px"
                          right="-20px"
                          w="100px"
                          h="100px"
                          borderRadius="full"
                          bg="radial-gradient(circle, rgba(20, 184, 166, 0.18) 0%, transparent 70%)"
                          pointerEvents="none"
                        />
                        <Flex
                          align={{ base: 'flex-start', sm: 'center' }}
                          justify="space-between"
                          gap={3}
                          mb={4}
                          flexDir={{ base: 'column', sm: 'row' }}
                          position="relative"
                          zIndex={1}
                        >
                          <HStack spacing={3} align="flex-start">
                            <Flex
                              w="44px"
                              h="44px"
                              borderRadius="14px"
                              bg="linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
                              align="center"
                              justify="center"
                              boxShadow="0 4px 14px rgba(13, 148, 136, 0.35)"
                              flexShrink={0}
                            >
                              <Icon as={BiShow} color="white" fontSize="22px" />
                            </Flex>
                            <Box>
                              <Heading size="sm" color="gray.800" fontWeight="800" letterSpacing="-0.02em">
                                Permisos del menú lateral
                              </Heading>
                              <Text fontSize="sm" color="gray.600" mt={0.5} lineHeight="1.45">
                                Activa las pantallas que este usuario verá en su portal.
                                {asignacionLibre
                                  ? ' Puedes asignar cualquier submódulo del catálogo del portal que le corresponde.'
                                  : ' Solo están disponibles los submódulos incluidos en el plan de la institución.'}
                                {' '}Los demás portales se muestran solo como referencia.
                              </Text>
                            </Box>
                          </HStack>
                          <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', sm: 'flex-end' }}>
                            {!permisosLoading && permisosTotalesCount > 0 && (
                              <>
                                <Button size="xs" variant="outline" colorScheme="teal" onClick={marcarTodosPermisos} borderRadius="full">
                                  Marcar todos
                                </Button>
                                <Button size="xs" variant="ghost" onClick={desmarcarTodosPermisos} borderRadius="full">
                                  Quitar todos
                                </Button>
                                <Badge
                                  colorScheme="teal"
                                  variant="subtle"
                                  px={3}
                                  py={1.5}
                                  borderRadius="full"
                                  fontSize="xs"
                                  fontWeight="700"
                                >
                                  <Icon as={BiCheckCircle} mr={1} verticalAlign="middle" />
                                  {selectedSubmoduleIds.length} / {permisosTotalesCount}
                                </Badge>
                              </>
                            )}
                          </HStack>
                        </Flex>

                        {permisosLoading ? (
                          <Flex justify="center" py={12}>
                            <VStack spacing={3}>
                              <Spinner color="teal.500" size="lg" thickness="3px" />
                              <Text fontSize="sm" color="gray.500">
                                Cargando permisos…
                              </Text>
                            </VStack>
                          </Flex>
                        ) : (
                          <Box
                            maxH={{ base: '52vh', md: '420px' }}
                            overflowY="auto"
                            pr={2}
                            sx={{
                              '&::-webkit-scrollbar': { width: '8px' },
                              '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(13, 148, 136, 0.35)',
                                borderRadius: 'full'
                              }
                            }}
                          >
                            {permisosProfileGroups.length === 0 ? (
                              <Flex
                                direction="column"
                                align="center"
                                justify="center"
                                py={10}
                                px={4}
                                borderRadius="xl"
                                bg="whiteAlpha.800"
                                border="1px dashed"
                                borderColor="teal.100"
                              >
                                <Icon as={BiGridAlt} fontSize="36px" color="teal.300" mb={2} />
                                <Text fontSize="sm" color="gray.600" textAlign="center" maxW="sm">
                                  No hay datos de permisos. Revisa la conexión o el catálogo en base de datos.
                                </Text>
                              </Flex>
                            ) : (
                              <VStack align="stretch" spacing={8}>
                                {permisosProfileGroups.map((profile, profileIdx) => {
                                  const grupMods = profile.modules || [];
                                  const itemCount = grupMods.reduce(
                                    (n, mo) => n + (mo.items?.length || 0),
                                    0
                                  );
                                  const itemCountEnPlan = grupMods.reduce(
                                    (n, mo) =>
                                      n +
                                      (mo.items || []).filter((it) =>
                                        puedeEditarPermisoItem(profile, it)
                                      ).length,
                                    0
                                  );
                                  return (
                                    <Box
                                      key={profile.key || profile.prefijo}
                                      opacity={profile.editable ? 1 : 0.88}
                                    >
                                      <Flex
                                        align={{ base: 'flex-start', md: 'center' }}
                                        justify="space-between"
                                        gap={2}
                                        mb={3}
                                        flexDir={{ base: 'column', md: 'row' }}
                                      >
                                        <HStack spacing={2} flexWrap="wrap">
                                          <Icon
                                            as={BiGridAlt}
                                            color={profile.editable ? 'teal.600' : 'gray.400'}
                                            fontSize="18px"
                                          />
                                          <Text fontWeight="800" fontSize="sm" color="gray.800">
                                            {profile.etiqueta}
                                          </Text>
                                          <Badge
                                            fontSize="10px"
                                            borderRadius="md"
                                            colorScheme={profile.editable ? 'teal' : 'gray'}
                                            variant={profile.editable ? 'solid' : 'outline'}
                                          >
                                            {profile.editable ? 'Editable · menú de este usuario' : 'Solo referencia'}
                                          </Badge>
                                          <Badge variant="outline" colorScheme="gray" fontSize="10px" borderRadius="md">
                                            {itemCountEnPlan}/{itemCount} en plan
                                          </Badge>
                                        </HStack>
                                        <Text fontSize="10px" color="gray.500" fontFamily="mono">
                                          {profile.prefijo}
                                        </Text>
                                      </Flex>
                                      {!profile.editable && (
                                        <Text fontSize="xs" color="gray.500" mb={3}>
                                          Este usuario no usa el portal {profile.etiqueta}: el menú lateral solo muestra
                                          rutas del tipo asignado al usuario.
                                        </Text>
                                      )}
                                      {itemCount === 0 ? (
                                        <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                          Sin submódulos registrados para este prefijo.
                                        </Text>
                                      ) : (
                                        <VStack align="stretch" spacing={6}>
                                          {grupMods.map((mod) => {
                                            const items = mod.items || [];
                                            if (items.length === 0) return null;
                                            const itemsEnPlan = items.filter((it) =>
                                              puedeEditarPermisoItem(profile, it)
                                            );
                                            const enModulo = itemsEnPlan.filter((it) =>
                                              selectedSubmoduleIds.includes(it.id_submodulo)
                                            ).length;
                                            return (
                                              <Box key={`${profile.key}-${mod.id_modulo}`}>
                                                <HStack spacing={2} mb={3} flexWrap="wrap">
                                                  <Text fontWeight="700" fontSize="xs" color="gray.600">
                                                    {mod.titulo}
                                                  </Text>
                                                  <Badge
                                                    variant="outline"
                                                    colorScheme="gray"
                                                    fontSize="10px"
                                                    borderRadius="md"
                                                  >
                                                    {enModulo}/{itemsEnPlan.length}
                                                  </Badge>
                                                </HStack>
                                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                                  {items.map((item) => {
                                                    const puedeUsar = puedeEditarPermisoItem(profile, item);
                                                    const on = profile.editable
                                                      ? puedeUsar &&
                                                        selectedSubmoduleIds.includes(item.id_submodulo)
                                                      : !!item.asignado;
                                                    const fueraDePlan =
                                                      profile.editable && item.en_plan !== true;
                                                    return (
                                                      <Flex
                                                        key={item.id_submodulo}
                                                        align="flex-start"
                                                        gap={3}
                                                        p={3}
                                                        borderRadius="xl"
                                                        pointerEvents={puedeUsar ? 'auto' : 'none'}
                                                        border="1px solid"
                                                        borderColor={
                                                          fueraDePlan
                                                            ? 'orange.100'
                                                            : on
                                                              ? 'teal.200'
                                                              : 'gray.100'
                                                        }
                                                        bg={
                                                          fueraDePlan
                                                            ? 'orange.50'
                                                            : profile.editable
                                                              ? on
                                                                ? 'rgba(204, 251, 241, 0.55)'
                                                                : 'rgba(255,255,255,0.85)'
                                                              : 'rgba(248,250,252,0.95)'
                                                        }
                                                        opacity={fueraDePlan ? 0.92 : 1}
                                                        boxShadow={
                                                          on && puedeUsar
                                                            ? '0 2px 12px rgba(13, 148, 136, 0.12)'
                                                            : '0 1px 3px rgba(0,0,0,0.04)'
                                                        }
                                                        transition="all 0.2s ease"
                                                        _hover={
                                                          puedeUsar
                                                            ? {
                                                                borderColor: 'teal.300',
                                                                bg: on
                                                                  ? 'rgba(204, 251, 241, 0.75)'
                                                                  : 'white'
                                                              }
                                                            : undefined
                                                        }
                                                      >
                                                        <Box
                                                          flex={1}
                                                          minW={0}
                                                          cursor={puedeUsar ? 'pointer' : 'default'}
                                                          onClick={() =>
                                                            togglePermisoSubmodulo(
                                                              item.id_submodulo,
                                                              profile.editable,
                                                              asignacionLibre || item.en_plan === true
                                                            )
                                                          }
                                                          py={0.5}
                                                        >
                                                          <HStack spacing={2} align="flex-start" flexWrap="wrap">
                                                            {fueraDePlan ? (
                                                              <Icon
                                                                as={BiLockAlt}
                                                                color="orange.500"
                                                                mt={0.5}
                                                                flexShrink={0}
                                                                aria-hidden
                                                              />
                                                            ) : null}
                                                            <Text
                                                              fontSize="sm"
                                                              fontWeight="700"
                                                              color="gray.800"
                                                              noOfLines={2}
                                                            >
                                                              {item.titulo}
                                                            </Text>
                                                          </HStack>
                                                          {fueraDePlan ? (
                                                            <Text fontSize="xs" color="orange.700" mt={1.5} fontWeight="600">
                                                              No disponible en la suscripción actual de la institución
                                                            </Text>
                                                          ) : null}
                                                          {item.descripcion ? (
                                                            <Text
                                                              fontSize="xs"
                                                              color="gray.600"
                                                              mt={1}
                                                              lineHeight="1.5"
                                                            >
                                                              {item.descripcion}
                                                            </Text>
                                                          ) : null}
                                                        </Box>
                                                        <Switch
                                                          colorScheme="teal"
                                                          size="md"
                                                          isChecked={on}
                                                          isDisabled={!puedeUsar}
                                                          opacity={puedeUsar ? 1 : 0.45}
                                                          onChange={() =>
                                                            togglePermisoSubmodulo(
                                                              item.id_submodulo,
                                                              profile.editable,
                                                              asignacionLibre || item.en_plan === true
                                                            )
                                                          }
                                                          mt={0.5}
                                                          flexShrink={0}
                                                        />
                                                      </Flex>
                                                    );
                                                  })}
                                                </SimpleGrid>
                                              </Box>
                                            );
                                          })}
                                        </VStack>
                                      )}
                                      {profileIdx < permisosProfileGroups.length - 1 ? (
                                        <Divider mt={6} borderColor="blackAlpha.100" />
                                      ) : null}
                                    </Box>
                                  );
                                })}
                              </VStack>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                  </VStack>
                </Box>
              </Flex>
      </SharedModal>

      {/* Dialog Baja */}
      <AlertDialog isOpen={isBajaOpen} leastDestructiveRef={cancelRef} onClose={onBajaClose}>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Dar de baja usuario
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Estás seguro que deseas dar de baja a <strong>{usuarioParaBaja?.nombre}</strong>?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onBajaClose}>Cancelar</Button>
              <Button colorScheme="orange" onClick={handleConfirmarBaja} ml={3}>Dar de Baja</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default GestionUsuarios;
