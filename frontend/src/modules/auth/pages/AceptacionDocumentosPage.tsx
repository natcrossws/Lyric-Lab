// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack, Checkbox, useToast, Spinner, Link
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/services/api';
import { getUserData, setUserData } from '@/shared/utils/storage';

const LABELS = {
  AVISO_PRIVACIDAD: 'Aviso de privacidad',
  TERMINOS_CONDICIONES: 'Términos y condiciones'
};

const AceptacionDocumentosPage = () => {
  const [pending, setPending] = useState([]);
  const [accepted, setAccepted] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/documentos/status');
        setPending(res.data.pendingDocs || []);
        if (!(res.data.pendingDocs || []).length) {
          const u = getUserData();
          if (u) setUserData({ ...u, pendingLegalDocs: false });
          navigate('/', { replace: true });
        }
      } catch {
        toast({ title: 'Error al cargar documentos', status: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async () => {
    for (const doc of pending) {
      if (!accepted[doc.type]) {
        toast({ title: `Debes aceptar: ${LABELS[doc.type] || doc.type}`, status: 'warning' });
        return;
      }
    }
    setSaving(true);
    try {
      for (const doc of pending) {
        await api.post('/documentos/aceptar', { type: doc.type, version: doc.version });
      }
      const u = getUserData();
      if (u) setUserData({ ...u, pendingLegalDocs: false });
      toast({ title: 'Documentos aceptados', status: 'success' });
      navigate('/', { replace: true });
    } catch {
      toast({ title: 'Error al aceptar', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={16}>
      <Container maxW="md">
        <VStack spacing={6} align="stretch" bg="white" p={8} borderRadius="xl" shadow="md">
          <Heading size="lg">Aceptación de documentos</Heading>
          <Text color="gray.600">Antes de continuar, acepta los documentos legales vigentes.</Text>
          {pending.map((doc) => (
            <Box key={doc.type} borderWidth="1px" borderRadius="md" p={4}>
              <Checkbox
                isChecked={!!accepted[doc.type]}
                onChange={(e) => setAccepted({ ...accepted, [doc.type]: e.target.checked })}
              >
                Acepto {LABELS[doc.type] || doc.type} (v{doc.version})
              </Checkbox>
              {doc.has_pdf && (
                <Text mt={2} fontSize="sm">
                  <Link href={doc.pdf_url} isExternal color="blue.500">Ver PDF</Link>
                </Text>
              )}
            </Box>
          ))}
          <Button colorScheme="blue" onClick={submit} isLoading={saving}>Continuar</Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default AceptacionDocumentosPage;
