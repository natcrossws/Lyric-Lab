import React from 'react';
import { HStack, Select, Text } from '@chakra-ui/react';

const TimeSelector = ({ value, onChange, size = 'sm', ...props }) => {
  // Parse convert 24h "HH:mm" to 12h parts
  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: '', minute: '', period: 'a.m.' };
    const [h, m] = timeStr.split(':').map(Number);
    
    let hour = h;
    let period = 'a.m.';

    if (hour >= 12) {
      period = 'p.m.';
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;

    return {
      hour: hour.toString().padStart(2, '0'),
      minute: m.toString().padStart(2, '0'),
      period
    };
  };

  const { hour, minute, period } = parseTime(value);

  // Helper to trigger onChange with new 24h string
  const updateTime = (newH, newM, newP) => {
    let h = parseInt(newH, 10);
    const m = newM;
    
    if (newP === 'p.m.' && h !== 12) {
      h += 12;
    } else if (newP === 'a.m.' && h === 12) {
      h = 0;
    }

    const hStr = h.toString().padStart(2, '0');
    onChange(`${hStr}:${m}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 4 }, (_, i) => (i * 15).toString().padStart(2, '0')); // 00, 15, 30, 45 (Steps? User might want 00-59)
  // Let's use 5 minute intervals? Or 10? Or even 1?
  // User had 30 min in screenshot, but manual input allows anything.
  // Standard classes usually start on :00 or :30. Let's offer :00, :15, :30, :45 for ease, 
  // but maybe allow typing? Select is safer. 
  // Let's broaden to 5-min intervals or 15. The screenshot showed "12:30".
  // Let's stick effectively to what's common. 15 mins seems robust enough for class scheduling.
  // Actually, let's do 10 mins or just 00-60 if needed? 
  // To match standard scheduling, 15 mins is safe. If precise time needed, we might need a different approach.
  // I will use 15-min intervals (00, 15, 30, 45) for now as it makes the dropdown cleaner.
  
  // Update: I will actually generate every 0, 5, 10... 55 just in case. 5 min intervals.
  const minutes5 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <HStack spacing={2} align="center" {...props}>
      {/* Hour */}
      <Select 
        value={hour} 
        onChange={(e) => updateTime(e.target.value, minute, period)}
        size={size}
        width="70px"
        bg="white"
        textAlign="center"
        fontWeight="medium"
      >
        <option value="" disabled>HH</option>
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </Select>
      <Text fontSize={size === 'xs' ? 'sm' : 'lg'} fontWeight="bold" color="gray.600" px={1}>:</Text>
      {/* Minute */}
      <Select 
        value={minute} 
        onChange={(e) => updateTime(hour, e.target.value, period)}
        size={size}
        width="70px"
        bg="white"
        textAlign="center"
        fontWeight="medium"
      >
        <option value="" disabled>MM</option>
        {minutes5.map(m => <option key={m} value={m}>{m}</option>)}
      </Select>
      {/* Period */}
      <Select 
        value={period} 
        onChange={(e) => updateTime(hour, minute, e.target.value)}
        size={size}
        width="75px"
        bg="white"
        fontWeight="medium"
      >
        <option value="a.m.">AM</option>
        <option value="p.m.">PM</option>
      </Select>
    </HStack>
  );
};

export default TimeSelector;
