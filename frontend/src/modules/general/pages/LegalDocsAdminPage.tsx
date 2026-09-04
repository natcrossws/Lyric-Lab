// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Button, VStack, HStack, Badge, useToast, Input, FormControl, FormLabel
} from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/context/AuthContext';
import api from '@/shared/services/api';
import AdminPageShell, { AdminMainPanel } from '@/shared/components/layout/AdminPageShell';

const TIPOS = [
  { key: 'AVISO_PRIVACIDAD', label: 'Aviso de privacidad' },
  { key: 'TERMINOS_CONDICIONES', label: 'Términos y condiciones' }
];

const LegalDocsAdminPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [docs, setDocs] = useState({});
  const [uploading, setUploading] = useState(null);

  const load = async () => {
    const res = await api.get('/general/legal-docs');
    setDocs(res.data.docs || {});
  };

  useEffect(() => {
    if (user?.role !== 'GLOBAL_ADMIN' && user?.role !== 'ADMIN') return;
    load().catch(() => toast({ title: 'Error al cargar docs', status: 'error' }));
  }, [user, toast]);

  if (user?.role !== 'GLOBAL_ADMIN' && user?.role !== 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const onUpload = async (tipo, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('pdf', file);
    setUploading(tipo);
    try {
      await api.post(`/general/legal-docs/${tipo}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await load();
      toast({ title: 'Documento actualizado', status: 'success' });
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Error al subir', status: 'error' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <AdminPageShell title="Documentos legales" subtitle="PDFs de plataforma (T&C y aviso de privacidad)">
      <AdminMainPanel>
        <VStack align="stretch" spacing={6}>
          {TIPOS.map(({ key, label }) => {
            const d = docs[key] || {};
            return (
              <Box key={key} borderWidth="1px" borderRadius="md" p={5}>
                <HStack justify="space-between" mb={3}>
                  <Heading size="sm">{label}</Heading>
                  <Badge>{d.version || '—'}</Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {d.nombre_archivo || 'Sin archivo'} {d.updated_at ? `· ${new Date(d.updated_at).toLocaleString()}` : ''}
                </Text>
                <HStack>
                  {d.r2_key && (
                    <Button as="a" href={`/api/general/legal-docs/${key}/pdf`} target="_blank" size="sm" variant="outline">
                      Ver PDF
                    </Button>
                  )}
                  <FormControl maxW="280px">
                    <FormLabel fontSize="sm" mb={1}>Subir nuevo PDF</FormLabel>
                    <Input
                      type="file"
                      accept="application/pdf"
                      size="sm"
                      onChange={(e) => onUpload(key, e.target.files?.[0])}
                      disabled={uploading === key}
                    />
                  </FormControl>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </AdminMainPanel>
    </AdminPageShell>
  );
};

export default LegalDocsAdminPage;
