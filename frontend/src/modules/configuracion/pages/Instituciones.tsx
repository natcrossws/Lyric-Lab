import React, { useState, useEffect } from 'react';
import {
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Switch,
  VStack,
  useToast,
  IconButton,
  Select
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiBriefcase } from 'react-icons/fi';
import api from '@/shared/services/api';
import AdminPageShell, { AdminMainPanel } from '@/shared/components/layout/AdminPageShell';
import SharedModal from '@/shared/components/overlays/SharedModal';

const Instituciones = () => {
  const [instituciones, setInstituciones] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    id_institucion: null,
    nombre: '',
    slug: '',
    subdominio: '',
    activo: true,
    fk_id_cat_plan_suscripcion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchInstituciones();
    api.get('/general/cat-planes').then((res) => setPlanes(res.data.planes || [])).catch(() => {});
  }, []);

  const fetchInstituciones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/general/instituciones');
      if (res.data.success) {
        setInstituciones(res.data.instituciones);
      }
    } catch (error) {
      toast({
        title: 'Error al cargar instituciones',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (inst = null) => {
    if (inst) {
      setFormData({
        id_institucion: inst.id_institucion,
        nombre: inst.nombre,
        slug: inst.slug || '',
        subdominio: inst.subdominio || '',
        activo: inst.activo,
        fk_id_cat_plan_suscripcion: inst.fk_id_cat_plan_suscripcion || ''
      });
    } else {
      setFormData({
        id_institucion: null,
        nombre: '',
        slug: '',
        subdominio: '',
        activo: true,
        fk_id_cat_plan_suscripcion: ''
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      if (formData.id_institucion) {
        await api.put(`/general/instituciones/${formData.id_institucion}/datos`, formData);
        await api.put(`/general/instituciones-admin/${formData.id_institucion}/plan-catalogo`, {
          fk_id_cat_plan_suscripcion: formData.fk_id_cat_plan_suscripcion
            ? parseInt(String(formData.fk_id_cat_plan_suscripcion), 10)
            : null
        });
        toast({ title: 'Institución actualizada', status: 'success' });
      } else {
        const created = await api.post('/general/instituciones', formData);
        const newId = created.data?.institucion?.id_institucion || created.data?.id_institucion;
        if (newId && formData.fk_id_cat_plan_suscripcion) {
          await api.put(`/general/instituciones-admin/${newId}/plan-catalogo`, {
            fk_id_cat_plan_suscripcion: parseInt(String(formData.fk_id_cat_plan_suscripcion), 10)
          });
        }
        toast({ title: 'Institución creada', status: 'success' });
      }
      onClose();
      fetchInstituciones();
    } catch (error) {
      toast({
        title: error.response?.data?.message || 'Error al guardar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageShell
        icon={FiBriefcase}
        title="Instituciones"
        description="Gestión de Tenants y accesos al sistema."
        titleAside={
          <Button
            leftIcon={<FiPlus />}
            colorScheme="brand"
            onClick={() => handleOpenDrawer()}
            borderRadius="full"
            px={6}
            h="42px"
          >
            Nueva Institución
          </Button>
        }
      />

      <AdminMainPanel overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Nombre</Th>
              <Th>Slug</Th>
              <Th>Plan</Th>
              <Th>Estatus</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {instituciones.map((inst) => (
              <Tr key={inst.id_institucion}>
                <Td>{inst.id_institucion}</Td>
                <Td fontWeight="medium">{inst.nombre}</Td>
                <Td>{inst.slug}</Td>
                <Td>{inst.plan_catalogo?.nombre || '—'}</Td>
                <Td>
                  <Badge colorScheme={inst.activo ? 'green' : 'red'}>
                    {inst.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Td>
                <Td>
                  <IconButton
                    aria-label="Editar"
                    icon={<FiEdit2 />}
                    size="sm"
                    onClick={() => handleOpenDrawer(inst)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </AdminMainPanel>

      <SharedModal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        title={formData.id_institucion ? 'Editar Institución' : 'Nueva Institución'}
        footer={
          <>
            <Button variant="outline" mr={3} onClick={onClose} borderRadius="xl">
              Cancelar
            </Button>
            <Button colorScheme="brand" onClick={handleSave} isLoading={isSubmitting} borderRadius="xl" px={6}>
              Guardar
            </Button>
          </>
        }
      >
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Nombre de la Institución</FormLabel>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej. Mi Gran Empresa"
              bg="rgba(255,255,255,0.8)"
              borderRadius="10px"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Slug (Opcional)</FormLabel>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="mi-empresa"
              bg="rgba(255,255,255,0.8)"
              borderRadius="10px"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>Si lo dejas en blanco, se generará a partir del nombre.</Text>
          </FormControl>

          <FormControl>
            <FormLabel>Subdominio (Opcional)</FormLabel>
            <Input
              value={formData.subdominio}
              onChange={(e) => setFormData({ ...formData, subdominio: e.target.value })}
              placeholder="mi-empresa.app.com"
              bg="rgba(255,255,255,0.8)"
              borderRadius="10px"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Plan de suscripción</FormLabel>
            <Select
              placeholder="Sin plan"
              value={formData.fk_id_cat_plan_suscripcion || ''}
              onChange={(e) => setFormData({ ...formData, fk_id_cat_plan_suscripcion: e.target.value })}
            >
              {planes.map((p) => (
                <option key={p.id_cat_plan_suscripcion} value={p.id_cat_plan_suscripcion}>
                  {p.nombre} — ${p.precio_mensual}/mes
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl display="flex" alignItems="center" bg="gray.50" p={3} borderRadius="lg" w="full" justifyContent="space-between">
            <FormLabel htmlFor="activo-switch" mb="0" fontWeight="600">
              ¿Institución Activa?
            </FormLabel>
            <Switch
              id="activo-switch"
              colorScheme="brand"
              size="lg"
              isChecked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
            />
          </FormControl>
        </VStack>
      </SharedModal>
    </>
  );
};

export default Instituciones;
