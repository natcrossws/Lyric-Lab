// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button, Link, Text, VStack, Heading, Spinner, Box } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import api from '@/shared/services/api';
import GlassDocumentContainer from '@/shared/components/ui/GlassDocumentContainer';

const AvisoPrivacidadPublico = () => {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get('/documentos/publico/aviso-privacidad');
        setMeta(response.data);
      } catch (error) {
        console.error('Error fetching public document', error);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box minH="60vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  const content = meta?.has_pdf
    ? `Aviso de privacidad (versión ${meta.version}).`
    : 'El aviso de privacidad aún no está disponible.';

  return (
    <GlassDocumentContainer
      actions={<></>}
      content={
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Aviso de privacidad</Heading>
          <Text>{content}</Text>
          {meta?.has_pdf && (
            <Link href={meta.pdf_url} isExternal color="blue.500">
              Ver PDF
            </Link>
          )}
        </VStack>
      }
    >
      <Button
        as={RouterLink}
        to="/login"
        colorScheme="brand"
        variant="outline"
        size="md"
        borderRadius="full"
        w="full"
      >
        Volver al Inicio
      </Button>
    </GlassDocumentContainer>
  );
};

export default AvisoPrivacidadPublico;
