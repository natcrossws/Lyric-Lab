import React from 'react';
import { Box, SimpleGrid, Input, Select, Button, Icon, HStack } from '@chakra-ui/react';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  key: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterSectionProps {
  fields: FilterField[];
  onSearch?: () => void;
}

/**
 * Componente Genérico para Secciones de Filtro (Dumb Component).
 * Genera dinámicamente inputs y selects para filtrar tablas o listas.
 */
export const FilterSection: React.FC<FilterSectionProps> = ({ fields, onSearch }) => {
  return (
    <Box
      mb={6}
      p={4}
      borderRadius="16px"
      bg="rgba(255,255,255,0.65)"
      backdropFilter="blur(20px) saturate(160%)"
      sx={{ WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}
      border="1px solid rgba(255,255,255,0.80)"
      boxShadow="0 2px 16px rgba(var(--brand-rgb),0.06), inset 0 1px 0 rgba(255,255,255,0.85)"
    >
      <SimpleGrid columns={{ base: 1, md: Math.min(fields.length, 4) }} spacing={3}>
        {fields.map((field) => {
          if (field.type === 'text') {
            return (
              <Input
                key={field.key}
                placeholder={field.placeholder || "Buscar..."}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
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
              />
            );
          }
          if (field.type === 'select') {
            return (
              <Select
                key={field.key}
                placeholder={field.placeholder || "Seleccionar..."}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
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
              >
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            );
          }
          return null;
        })}
        {onSearch && (
            <Button colorScheme="brand" onClick={onSearch} leftIcon={<Icon as={FiSearch} />} h="40px">
                Buscar
            </Button>
        )}
      </SimpleGrid>
    </Box>
  );
};

export default FilterSection;
