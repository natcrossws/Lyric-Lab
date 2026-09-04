import React from 'react';
import { Box, Heading, Text, useColorModeValue } from "@chakra-ui/react";

interface ShowcaseGlassCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Tarjeta de showcase alineada con chips del sidebar (vidrio + borde institucional). */
export default function ShowcaseGlassCard({ title, subtitle, children }: ShowcaseGlassCardProps) {
  const bg = useColorModeValue("rgba(255,255,255,0.88)", "rgba(16,86,102,0.05)");
  const border = useColorModeValue(
    "1px solid rgba(var(--brand-rgb), 0.16)",
    "1px solid rgba(255,255,255,0.08)"
  );

  return (
    <Box
      bg={bg}
      backdropFilter="blur(14px) saturate(150%)"
      borderRadius="2xl"
      border={border}
      boxShadow="0 8px 32px rgba(var(--brand-rgb), 0.1)"
      p={{ base: 5, md: 7 }}
      w="full"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      position="relative"
      overflow="hidden"
      _hover={{
        boxShadow: "0 12px 40px rgba(var(--brand-rgb), 0.14)",
      }}
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        bgGradient="linear(90deg, brand.500, secondary.400)"
      />
      <Box pt={1}>
        {(title || subtitle) && (
          <Box mb={6}>
            {title && (
              <Heading
                size="md"
                fontWeight="800"
                color="brand.700"
                letterSpacing="tight"
              >
                {title}
              </Heading>
            )}
            {subtitle && (
              <Text
                fontSize="sm"
                color="gray.500"
                mt={1}
                fontWeight="500"
              >
                {subtitle}
              </Text>
            )}
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
}
