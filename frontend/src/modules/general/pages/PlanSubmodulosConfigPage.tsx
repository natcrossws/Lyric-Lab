// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Text, Select, Button, Flex, HStack, VStack, Spinner, Switch,
  SimpleGrid, useToast, FormControl, FormLabel, Input, Tabs, TabList, TabPanels, Tab, TabPanel, Badge
} from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/context/AuthContext';
import api from '@/shared/services/api';
import AdminPageShell, { AdminMainPanel } from '@/shared/components/layout/AdminPageShell';

const PlanSubmodulosConfigPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [planes, setPlanes] = useState([]);
  const [planId, setPlanId] = useState('');
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPlan, setNewPlan] = useState({ nombre: '', precio_mensual: 0 });

  const loadPlanes = useCallback(async () => {
    const res = await api.get('/general/cat-planes');
    setPlanes(res.data.planes || []);
  }, []);

  useEffect(() => {
    if (user?.role !== 'GLOBAL_ADMIN' && user?.role !== 'ADMIN') return;
    (async () => {
      try {
        await loadPlanes();
      } catch (e) {
        toast({ title: 'Error al cargar planes', status: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, loadPlanes, toast]);

  useEffect(() => {
    if (!planId) { setEditor(null); return; }
    (async () => {
      try {
        const res = await api.get(`/general/cat-planes/${planId}/submodulos-editor`);
        setEditor(res.data);
      } catch {
        toast({ title: 'Error al cargar editor', status: 'error' });
      }
    })();
  }, [planId, toast]);

  if (user?.role !== 'GLOBAL_ADMIN' && user?.role !== 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const toggleItem = (tipo, subId, value) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const groups = (prev.profile_groups || []).map((g) => {
        if (g.fk_id_cat_tipo_usuario !== tipo) return g;
        return {
          ...g,
          modules: (g.modules || []).map((m) => ({
            ...m,
            items: (m.items || []).map((it) =>
              it.id_submodulo === subId ? { ...it, in_plan: value } : it
            )
          }))
        };
      });
      return { ...prev, profile_groups: groups };
    });
  };

  const saveSubmodulos = async () => {
    if (!planId || !editor) return;
    const porTipo = {};
    for (const g of editor.profile_groups || []) {
      const ids = [];
      for (const m of g.modules || []) {
        for (const it of m.items || []) {
          if (it.in_plan) ids.push(it.id_submodulo);
        }
      }
      porTipo[String(g.fk_id_cat_tipo_usuario)] = ids;
    }
    setSaving(true);
    try {
      await api.put(`/general/cat-planes/${planId}/submodulos`, { id_submodulos_por_tipo: porTipo });
      toast({ title: 'Plan actualizado', status: 'success' });
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Error al guardar', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const createPlan = async () => {
    try {
      const res = await api.post('/general/cat-planes', {
        nombre: newPlan.nombre,
        precio_mensual: Number(newPlan.precio_mensual) || 0,
        limite_horas_ia: 0,
        limite_storage_gb: 5,
        limite_users: 10,
        activo: true
      });
      await loadPlanes();
      setPlanId(String(res.data.plan.id_cat_plan_suscripcion));
      setNewPlan({ nombre: '', precio_mensual: 0 });
      toast({ title: 'Plan creado', status: 'success' });
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Error al crear plan', status: 'error' });
    }
  };

  return (
    <AdminPageShell title="Planes y submódulos" subtitle="Configura qué ve cada portal según el plan SaaS">
      <AdminMainPanel>
        {loading ? <Spinner /> : (
          <VStack align="stretch" spacing={6}>
            <Flex gap={4} wrap="wrap" align="end">
              <FormControl maxW="320px">
                <FormLabel>Plan</FormLabel>
                <Select placeholder="Selecciona un plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  {planes.map((p) => (
                    <option key={p.id_cat_plan_suscripcion} value={p.id_cat_plan_suscripcion}>
                      {p.nombre} — ${p.precio_mensual}/mes
                    </option>
                  ))}
                </Select>
              </FormControl>
              <HStack>
                <Input placeholder="Nuevo plan" value={newPlan.nombre} onChange={(e) => setNewPlan({ ...newPlan, nombre: e.target.value })} />
                <Input type="number" placeholder="Precio" w="120px" value={newPlan.precio_mensual} onChange={(e) => setNewPlan({ ...newPlan, precio_mensual: e.target.value })} />
                <Button onClick={createPlan} colorScheme="blue">Crear</Button>
              </HStack>
            </Flex>

            {editor && (
              <>
                <Tabs>
                  <TabList>
                    {(editor.profile_groups || []).map((g) => (
                      <Tab key={g.key}>{g.etiqueta}</Tab>
                    ))}
                  </TabList>
                  <TabPanels>
                    {(editor.profile_groups || []).map((g) => (
                      <TabPanel key={g.key} px={0}>
                        <VStack align="stretch" spacing={4}>
                          {(g.modules || []).map((m) => (
                            <Box key={m.id_modulo} borderWidth="1px" borderRadius="md" p={4}>
                              <Heading size="sm" mb={3}>{m.titulo}</Heading>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                {(m.items || []).map((it) => (
                                  <Flex key={it.id_submodulo} justify="space-between" align="center" py={1}>
                                    <Box>
                                      <Text fontWeight="medium">{it.titulo}</Text>
                                      <Text fontSize="xs" color="gray.500">{it.ruta}</Text>
                                    </Box>
                                    <Switch
                                      isChecked={!!it.in_plan}
                                      onChange={(e) => toggleItem(g.fk_id_cat_tipo_usuario, it.id_submodulo, e.target.checked)}
                                    />
                                  </Flex>
                                ))}
                              </SimpleGrid>
                            </Box>
                          ))}
                        </VStack>
                      </TabPanel>
                    ))}
                  </TabPanels>
                </Tabs>
                <Button colorScheme="blue" onClick={saveSubmodulos} isLoading={saving} alignSelf="flex-start">
                  Guardar submódulos del plan
                </Button>
              </>
            )}
            {!planId && <Text color="gray.500">Selecciona o crea un plan para editar submódulos.</Text>}
          </VStack>
        )}
      </AdminMainPanel>
    </AdminPageShell>
  );
};

export default PlanSubmodulosConfigPage;
