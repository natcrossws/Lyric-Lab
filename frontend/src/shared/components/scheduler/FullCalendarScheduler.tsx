import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
// @ts-ignore
import esLocale from '@fullcalendar/core/locales/es';
import { Box } from '@chakra-ui/react';

const FullCalendarScheduler = ({ 
  events, 
  onDateClick, 
  onEventClick, 
  eventContent, // NEW: Allow custom rendering
  slotMinTime = "07:00:00", 
  slotMaxTime = "22:00:00" 
}) => {
  // Handlers wrapper
  const handleDateClick = (arg) => {
    // arg.dateStr, arg.date
    if (onDateClick) onDateClick(arg);
  };

  const handleEventClick = (clickInfo) => {
    // clickInfo.event
    if (onEventClick) onEventClick(clickInfo);
  };

  return (
    <Box 
      h="800px" 
      bg="white" 
      p={4} 
      borderRadius="xl" 
      boxShadow="sm"
      sx={{
        // --- General Container ---
        '--fc-border-color': '#E2E8F0',
        '--fc-button-text-color': '#2D3748',
        '--fc-button-bg-color': 'white',
        '--fc-button-border-color': '#E2E8F0',
        '--fc-button-hover-bg-color': '#EBF8FF',
        '--fc-button-hover-border-color': '#3182CE',
        '--fc-button-active-bg-color': '#3182CE',
        '--fc-button-active-border-color': '#3182CE',
        '--fc-button-active-text-color': 'white',
        '--fc-event-bg-color': '#3182CE',
        '--fc-event-border-color': '#3182CE',
        '--fc-today-bg-color': '#F7FAFC',
        '--fc-neutral-bg-color': '#F7FAFC',

        fontFamily: 'Inter, sans-serif',
        
        // --- Toolbar ---
        '.fc-toolbar-title': {
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#2D3748',
          textTransform: 'capitalize'
        },
        '.fc-button-primary': {
          fontWeight: '600',
          textTransform: 'capitalize',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s',
          _focus: { boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)' }
        },
        '.fc-button-group > .fc-button': {
          marginRight: '4px',
          borderRadius: '8px !important' // Independent buttons
        },

        // --- Headers ---
        '.fc-col-header-cell': {
          backgroundColor: '#F7FAFC', // gray.50
          padding: '12px 0',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          color: '#718096',
          borderBottom: '2px solid #E2E8F0 !important'
        },
        '.fc-col-header-cell-cushion': {
          textDecoration: 'none', // Remove link underlines
          color: 'inherit' 
        },

        // --- Time Grid ---
        '.fc-timegrid-slot-label': {
          fontWeight: '500',
          color: '#A0AEC0',
          fontSize: '0.8rem'
        },
        '.fc-timegrid-slot': {
          height: '50px', // Even taller for comfort
          _hover: { backgroundColor: '#F0FFF4' } // Subtle green hover on slot
        },

        // --- Events ---
        '.fc-event': {
          cursor: 'pointer',
          borderRadius: '6px',
          border: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '4px 6px',
          fontWeight: '500',
          fontSize: '0.85rem',
          transition: 'transform 0.1s, box-shadow 0.1s',
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.12)'
          }
        },
        '.fc-event-main': {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        },
        
        // --- Today Highlight ---
        '.fc-day-today': {
          backgroundColor: 'var(--chakra-colors-brand-50) !important' // brand.50 crema
        }
      }}
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día'
        }}
        locale={esLocale}
        events={events} // [{ title, start, end, backgroundColor, extendedProps... }]
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        allDaySlot={false}
        nowIndicator={true}
        height="100%"
        expandRows={true}
        // Custom rendering if needed:
        eventContent={eventContent}
        firstDay={1} // Monday first
        hiddenDays={[0]} // Hide Sunday if desired, but user wants to fix Sunday classes, so show all? User complained about Sunday data. Let's show all for now.
        // Actually, user context implies classes are Mon-Sat mostly. Let's keep Sunday visible to detect bugs.
      />
    </Box>
  );
};

export default FullCalendarScheduler;
