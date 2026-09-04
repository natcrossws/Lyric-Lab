import React, { useEffect, useRef } from 'react';
import {
    Box,
    HStack,
    IconButton,
    Tooltip,
    useColorModeValue,
} from '@chakra-ui/react';
import {
    FaBold,
    FaItalic,
    FaUnderline,
    FaListUl,
    FaListOl,
    FaLink,
    FaQuoteRight,
    FaAlignLeft,
    FaAlignCenter,
    FaAlignRight,
    FaHeading,
} from 'react-icons/fa';

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);
    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            // Only update if content is different to avoid cursor jumping
            if (value === '' && editorRef.current.innerHTML === '<br>') return;
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current.focus();
    };

    const ToolbarButton = ({ icon, label, command, arg }) => (
        <Tooltip label={label} placement="top">
            <IconButton
                size="sm"
                variant="ghost"
                icon={icon}
                aria-label={label}
                onClick={() => execCommand(command, arg)}
                color="gray.600"
                _hover={{ bg: 'gray.100', color: 'brand.500' }}
            />
        </Tooltip>
    );

    return (
        <Box
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            bg={bg}
            overflow="hidden"
            transition="all 0.2s"
            _focusWithin={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
        >
            <HStack
                p={2}
                borderBottom="1px solid"
                borderColor={borderColor}
                bg="gray.50"
                spacing={1}
                wrap="wrap"
            >
                <ToolbarButton icon={<FaBold />} label="Negrita" command="bold" arg={null} />
                <ToolbarButton icon={<FaItalic />} label="Cursiva" command="italic" arg={null} />
                <ToolbarButton icon={<FaUnderline />} label="Subrayado" command="underline" arg={null} />
                <Box w="1px" h="20px" bg="gray.300" mx={2} />
                <ToolbarButton icon={<FaHeading />} label="Título" command="formatBlock" arg="H3" />
                <ToolbarButton icon={<FaQuoteRight />} label="Cita" command="formatBlock" arg="blockquote" />
                <Box w="1px" h="20px" bg="gray.300" mx={2} />
                <ToolbarButton icon={<FaListUl />} label="Lista con viñetas" command="insertUnorderedList" arg={null} />
                <ToolbarButton icon={<FaListOl />} label="Lista numerada" command="insertOrderedList" arg={null} />
                <Box w="1px" h="20px" bg="gray.300" mx={2} />
                <ToolbarButton icon={<FaAlignLeft />} label="Alinear Izquierda" command="justifyLeft" arg={null} />
                <ToolbarButton icon={<FaAlignCenter />} label="Centrar" command="justifyCenter" arg={null} />
                <ToolbarButton icon={<FaAlignRight />} label="Alinear Derecha" command="justifyRight" arg={null} />
            </HStack>

            <Box
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                p={4}
                minH="200px"
                outline="none"
                css={{
                    '&:empty:before': {
                        content: `"${placeholder || 'Escribe aquí...'}"`,
                        color: 'gray.400',
                    },
                    'ul': { paddingLeft: '20px', marginBottom: '10px' },
                    'ol': { paddingLeft: '20px', marginBottom: '10px' },
                    'blockquote': {
                        borderLeft: '4px solid #CBD5E0',
                        paddingLeft: '16px',
                        color: 'gray.600',
                        fontStyle: 'italic'
                    }
                }}
            />
        </Box>
    );
};

export default RichTextEditor;
