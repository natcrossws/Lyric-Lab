import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

export type AnimationType =
  | "image"
  | "waves"
  | "particles"
  | "gradient"
  | "aurora"
  | "grid"
  | "pulse"
  | "legacy";

interface AnimatedBackgroundProps {
  type: AnimationType;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  imageUrl?: string;
}

export default function AnimatedBackground({
  type,
  primaryColor,
  secondaryColor,
  backgroundColor,
  imageUrl,
}: AnimatedBackgroundProps) {
  // Common Overlay
  const Overlay = () => (
    <Box
      position="absolute"
      inset={0}
      opacity={type === "image" ? 0.3 : 0.15}
      bg={type === "image" ? "rgba(0,0,0,0.6)" : "transparent"}
      backgroundImage={
        type !== "image" && type !== "grid" && type !== "legacy"
          ? `radial-gradient(${primaryColor} 1px, transparent 1px)`
          : "none"
      }
      backgroundSize="50px 50px"
      pointerEvents="none"
      zIndex={0}
    />
  );

  return (
    <Box
      position="absolute"
      inset={0}
      overflow="hidden"
      bg={backgroundColor}
      zIndex={0}
    >
      {type === "image" && imageUrl && (
        <Box
          position="absolute"
          inset={0}
          backgroundImage={`url(${imageUrl})`}
          backgroundPosition="center"
          backgroundSize="cover"
          backgroundRepeat="no-repeat"
        />
      )}

      {type === "waves" && (
        <>
          <MotionBox
            position="absolute"
            top="-10%"
            left="-10%"
            w="50%"
            h="50%"
            bg={primaryColor}
            borderRadius="full"
            filter="blur(100px)"
            opacity={0.6}
            animate={{
              x: ["0%", "20%", "0%"],
              y: ["0%", "15%", "0%"],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <MotionBox
            position="absolute"
            bottom="-10%"
            right="-10%"
            w="60%"
            h="60%"
            bg={secondaryColor}
            borderRadius="full"
            filter="blur(120px)"
            opacity={0.7}
            animate={{
              x: ["0%", "-15%", "0%"],
              y: ["0%", "-10%", "0%"],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <MotionBox
            position="absolute"
            top="40%"
            left="30%"
            w="40%"
            h="40%"
            bg={secondaryColor}
            borderRadius="full"
            filter="blur(90px)"
            opacity={0.4}
            animate={{
              x: ["0%", "15%", "-10%", "0%"],
              y: ["0%", "-15%", "10%", "0%"],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {type === "particles" && (
        <Box position="absolute" inset={0}>
          {Array.from({ length: 25 }).map((_, i) => (
            <MotionBox
              key={`particle-${i}`}
              position="absolute"
              bg={i % 2 === 0 ? primaryColor : secondaryColor}
              borderRadius="full"
              opacity={Math.random() * 0.5 + 0.1}
              w={`${Math.random() * 30 + 10}px`}
              h={`${Math.random() * 30 + 10}px`}
              bottom="-10%"
              left={`${Math.random() * 100}%`}
              animate={{
                y: ["0vh", "-120vh"],
                x: ["0px", `${(Math.random() - 0.5) * 200}px`],
                rotate: [0, 360],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 15,
              }}
            />
          ))}
        </Box>
      )}

      {type === "gradient" && (
        <MotionBox
          position="absolute"
          inset={0}
          style={{
            background: `linear-gradient(-45deg, ${primaryColor}, ${secondaryColor}, ${backgroundColor}, ${primaryColor})`,
            backgroundSize: "400% 400%",
          }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      )}

      {type === "aurora" && (
        <Box position="absolute" inset={0} bg={backgroundColor}>
          <MotionBox
            position="absolute"
            inset="-50%"
            style={{
              background: `conic-gradient(from 90deg at 50% 50%, ${backgroundColor}, ${primaryColor}, ${secondaryColor}, ${backgroundColor})`,
              filter: "blur(100px)",
              opacity: 0.8,
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </Box>
      )}

      {type === "grid" && (
        <Box
          position="absolute"
          inset={0}
          bg={backgroundColor}
          sx={{ perspective: "1000px" }}
        >
          {/* Suelo cuadriculado estilo TRON moviéndose hacia el usuario */}
          <Box
            position="absolute"
            bottom="0"
            w="100%"
            h="60%"
            overflow="hidden"
          >
            <MotionBox
              position="absolute"
              w="200%"
              h="200%"
              bottom="-50%"
              left="-50%"
              style={{
                backgroundImage: `
                    linear-gradient(to right, ${primaryColor} 1px, transparent 1px),
                    linear-gradient(to top,   ${primaryColor} 1px, transparent 1px)
                  `,
                backgroundSize: "60px 60px",
                transformOrigin: "top center",
              }}
              animate={{
                transform: [
                  "perspective(500px) rotateX(70deg) translateY(0px)",
                  "perspective(500px) rotateX(70deg) translateY(60px)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              opacity={0.3}
            />
          </Box>
          <Box
            position="absolute"
            top="0"
            w="100%"
            h="40%"
            bgGradient={`linear(to-b, ${secondaryColor}20, ${backgroundColor})`}
          />
        </Box>
      )}

      {type === "pulse" && (
        <Box
          position="absolute"
          inset={0}
          bg={backgroundColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {[1, 2, 3, 4].map((i) => (
            <MotionBox
              key={`pulse-${i}`}
              position="absolute"
              w="100px"
              h="100px"
              borderRadius="full"
              border="2px solid"
              borderColor={i % 2 === 0 ? primaryColor : secondaryColor}
              animate={{
                scale: [1, 10],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "easeOut",
              }}
            />
          ))}
        </Box>
      )}

      {type === "legacy" && (
        <Box position="absolute" inset={0} overflow="hidden">
          {/* Ported from login.css .shape1 */}
          <MotionBox
            position="absolute"
            w="300px"
            h="300px"
            top="-6px"
            left="-9px"
            zIndex={3}
            borderRadius="40px"
            filter="blur(0.2px)"
            boxShadow="0 20px 70px rgba(0,0,0,0.5)"
            bg={`linear-gradient(135deg, ${backgroundColor}, ${primaryColor})`}
            animate={{ x: [0, 5, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
          />
          {/* Ported from login.css .shape2 */}
          <MotionBox
            position="absolute"
            w="600px"
            h="600px"
            top="-120px"
            left="-25px"
            zIndex={2}
            borderRadius="40px"
            filter="blur(0.2px)"
            boxShadow="0 20px 70px rgba(0,0,0,0.5)"
            bg={`linear-gradient(135deg, ${backgroundColor}, ${secondaryColor})`}
            style={{ rotate: "20deg" }}
            animate={{ x: [0, 5, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          {/* Ported from login.css .shape3 */}
          <MotionBox
            position="absolute"
            w="650px"
            h="491px"
            top="-113px"
            right="400px"
            zIndex={1}
            borderRadius="40px"
            filter="blur(0.2px)"
            boxShadow="0 20px 70px rgba(0,0,0,0.5)"
            bg={`linear-gradient(135deg, ${backgroundColor}, ${primaryColor})`}
            style={{ rotate: "20deg" }}
            animate={{ x: [0, 5, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          {/* Ported from login.css .shape4 */}
          <MotionBox
            position="absolute"
            w="800px"
            h="700px"
            top="-150px"
            left="462px"
            zIndex={1}
            borderRadius="40px"
            filter="blur(0.2px)"
            boxShadow="0 20px 70px rgba(0,0,0,0.5)"
            bg={`linear-gradient(135deg, ${backgroundColor}, ${secondaryColor})`}
            style={{ rotate: "20deg" }}
            animate={{ x: [0, 5, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
          />
          {/* Ported from login.css .shape5 */}
          <MotionBox
            position="absolute"
            w="min(34vw, 560px)"
            h="min(24vw, 380px)"
            top="310px"
            left="min(26vw, 360px)"
            zIndex={1.5}
            borderRadius="40px"
            filter="blur(0.2px)"
            boxShadow="0 20px 70px rgba(0,0,0,0.5)"
            bg={`linear-gradient(135deg, ${backgroundColor}, ${primaryColor})`}
            style={{ rotate: "21deg" }}
            animate={{ x: [0, 5, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </Box>
      )}

      <Overlay />
    </Box>
  );
}
