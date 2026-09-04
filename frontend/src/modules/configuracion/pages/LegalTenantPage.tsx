// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Heading, Text, Button, VStack, Tabs, TabList, TabPanels, Tab, TabPanel,
  Textarea, FormControl, FormLabel, useToast, Spinner, HStack
} from '@chakra-ui/react';
import api from '@/shared/services/api';
import AdminPageShell, { AdminMainPanel } from '@/shared/components/layout/AdminPageShell';

const DOCS = [
  { codigo: 'aviso-privacidad', label: 'Aviso de privacidad' },
  { codigo: 'terminos-condiciones', label: 'Términos y condiciones' }
];

const LegalTenantPage = () => {
  const toast = useToast();
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const entries = {};
        for (const d of DOCS) {
          const res = await api.get(`/institucion/legal/${d.codigo}`);
          entries[d.codigo] = res.data.doc;
        }
        setDocs(entries);
      } catch {
        toast({ title: 'Error al cargar legales del tenant', status: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (codigo) => {
    setSaving(true);
    try {
      const doc = docs[codigo] || { titulo: { es: '' }, contenido_html: { es: '' } };
      const res = await api.put(`/institucion/legal/${codigo}`, {
        titulo: doc.titulo || { es: '' },
        contenido_html: doc.contenido_html || { es: '' }
      });
      setDocs({ ...docs, [codigo]: res.data.doc });
      toast({ title: 'Guardado', status: 'success' });
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Error al guardar', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const publish = async (codigo) => {
    try {
      const res = await api.post(`/institucion/legal/${codigo}/publish`);
      setDocs({ ...docs, [codigo]: res.data.doc });
      toast({ title: `Publicada v${res.data.doc.version}`, status: 'success' });
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Error al publicar', status: 'error' });
    }
  };

  const setHtml = (codigo, value) => {
    setDocs((prev) => {
      const cur = prev[codigo] || { contenido_html: { es: '' }, titulo: { es: '' } };
      return {
        ...prev,
        [codigo]: {
          ...cur,
          contenido_html: { ...(cur.contenido_html || {}), es: value }
        }
      };
    });
  };

  return (
    <AdminPageShell title="Documentos legales del sitio" subtitle="Aviso y términos propios de tu institución">
      <AdminMainPanel>
        {loading ? <Spinner /> : (
          <Tabs>
            <TabList>
              {DOCS.map((d) => <Tab key={d.codigo}>{d.label}</Tab>)}
            </TabList>
            <TabPanels>
              {DOCS.map((d) => {
                const doc = docs[d.codigo];
                const html = doc?.contenido_html?.es || '';
                return (
                  <TabPanel key={d.codigo} px={0}>
                    <VStack align="stretch" spacing={4}>
                      <Text fontSize="sm" color="gray.500">Versión: {doc?.version || 'nueva'}</Text>
                      <FormControl>
                        <FormLabel>Contenido HTML (ES)</FormLabel>
                        <Textarea minH="280px" value={html} onChange={(e) => setHtml(d.codigo, e.target.value)} />
                      </FormControl>
                      <HStack>
                        <Button colorScheme="blue" onClick={() => save(d.codigo)} isLoading={saving}>Guardar borrador</Button>
                        <Button variant="outline" onClick={() => publish(d.codigo)}>Publicar nueva versión</Button>
                      </HStack>
                    </VStack>
                  </TabPanel>
                );
              })}
            </TabPanels>
          </Tabs>
        )}
      </AdminMainPanel>
    </AdminPageShell>
  );
};

export default LegalTenantPage;
