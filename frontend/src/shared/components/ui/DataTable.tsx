import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Text,
  Spinner,
  Flex
} from '@chakra-ui/react';

interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Componente Genérico de Tabla (Dumb Component).
 * Recibe la data y la definición de columnas dinámicas.
 */
export function DataTable<T>({ 
  data, 
  columns, 
  isLoading = false,
  emptyMessage = "No hay registros para mostrar."
}: DataTableProps<T>) {
  
  if (isLoading) {
    return (
      <Flex justify="center" align="center" p={10}>
        <Spinner color="var(--chakra-colors-brand-500)" size="xl" />
      </Flex>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box p={6} textAlign="center" color="gray.500" bg="white" borderRadius="lg" boxShadow="sm">
        <Text>{emptyMessage}</Text>
      </Box>
    );
  }

  return (
    <TableContainer bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
      <Table variant="simple" size="md">
        <Thead bg="gray.50">
          <Tr>
            {columns.map((col, idx) => (
              <Th key={col.key || idx} color="gray.600" py={4}>
                {col.header}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item, rowIdx) => (
            <Tr key={rowIdx} _hover={{ bg: 'gray.50' }} transition="all 0.2s">
              {columns.map((col, colIdx) => (
                <Td key={colIdx} py={4}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

export default DataTable;
