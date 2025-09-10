import { useState, useEffect } from 'react';
import { Text, Box } from '@chakra-ui/react';

interface CountdownTimerProps {
  timeRemaining: number; // in milliseconds
  onComplete?: () => void;
  format?: 'minutes' | 'hours' | 'full';
  size?: 'sm' | 'md' | 'lg';
}

const CountdownTimer = ({
  timeRemaining,
  onComplete,
  format = 'minutes',
  size = 'md',
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);

  // Text sizes based on the size prop
  const textSizes = {
    sm: { hours: 'xs', minutes: 'lg', seconds: 'sm' },
    md: { hours: 'sm', minutes: 'xl', seconds: 'md' },
    lg: { hours: 'md', minutes: '2xl', seconds: 'lg' },
  };

  useEffect(() => {
    // Update time left when the timeRemaining prop changes
    setTimeLeft(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }

    // Update the countdown every second
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timerId);
          if (onComplete) onComplete();
          return 0;
        }
        return prevTime - 1000;
      });
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timerId);
  }, [timeLeft, onComplete]);

  // Format time in MM:SS or HH:MM:SS format
  const formatTime = (ms: number) => {
    // Total seconds
    const totalSeconds = Math.ceil(ms / 1000);
    
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (format === 'hours' || (format === 'full' && hours > 0)) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  // Get color based on time remaining
  const getColor = () => {
    if (timeLeft < 300000) return 'red.500'; // Less than 5 minutes
    if (timeLeft < 900000) return 'orange.500'; // Less than 15 minutes
    return 'gray.700';
  };

  // Get time segments for visual display
  const getTimeSegments = () => {
    const totalSeconds = Math.ceil(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = getTimeSegments();
  const showHours = format === 'hours' || (format === 'full' && hours > 0);
  const color = getColor();

  return (
    <Box textAlign="center">
      {format === 'full' ? (
        <Box>
          <Text 
            fontSize={textSizes[size].minutes} 
            fontWeight="bold" 
            color={color}
            lineHeight="1"
          >
            {formatTime(timeLeft)}
          </Text>
          <Text fontSize={textSizes[size].seconds} color="gray.500" mt={1}>
            Time Remaining
          </Text>
        </Box>
      ) : (
        <Box>
          <HStack spacing={1} justify="center">
            {showHours && (
              <>
                <Box textAlign="center">
                  <Text 
                    fontSize={textSizes[size].hours} 
                    color="gray.500"
                    mb={-1}
                  >
                    Hours
                  </Text>
                  <Text 
                    fontSize={textSizes[size].minutes} 
                    fontWeight="bold" 
                    color={color}
                    lineHeight="1"
                    minW={textSizes[size].minutes === '2xl' ? '50px' : '40px'}
                  >
                    {hours.toString().padStart(2, '0')}
                  </Text>
                </Box>
                <Text fontSize={textSizes[size].minutes} color={color}>:</Text>
              </>
            )}
            <Box textAlign="center">
              <Text 
                fontSize={textSizes[size].hours} 
                color="gray.500"
                mb={-1}
              >
                Minutes
              </Text>
              <Text 
                fontSize={textSizes[size].minutes} 
                fontWeight="bold" 
                color={color}
                lineHeight="1"
                minW={textSizes[size].minutes === '2xl' ? '50px' : '40px'}
              >
                {minutes.toString().padStart(2, '0')}
              </Text>
            </Box>
            <Text fontSize={textSizes[size].minutes} color={color}>:</Text>
            <Box textAlign="center">
              <Text 
                fontSize={textSizes[size].hours} 
                color="gray.500"
                mb={-1}
              >
                Seconds
              </Text>
              <Text 
                fontSize={textSizes[size].minutes} 
                fontWeight="bold" 
                color={color}
                lineHeight="1"
                minW={textSizes[size].minutes === '2xl' ? '50px' : '40px'}
              >
                {seconds.toString().padStart(2, '0')}
              </Text>
            </Box>
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default CountdownTimer;
