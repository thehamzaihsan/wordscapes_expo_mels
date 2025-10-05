import { getGlobalSettings } from '@/hooks/useSettings';
import { useEffect, useState } from "react";
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

// Particle interface
interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

export default function BGAnimation() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  // Handle dimension changes (e.g., device rotation)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Check settings periodically
  useEffect(() => {
    const checkSettings = () => {
      const settings = getGlobalSettings();
      setAnimationsEnabled(settings.backgroundAnimationsEnabled);
    };
    
    checkSettings();
    const interval = setInterval(checkSettings, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, []);

  // Create floating particles
  useEffect(() => {
    if (!animationsEnabled) {
      setParticles([]);
      return;
    }

  const particleColors = ["#8B5CF6"];
    const createParticle = (id: number): Particle => ({
      id,
      x: new Animated.Value(Math.random() * dimensions.width),
      y: new Animated.Value(Math.random() * dimensions.height),
      opacity: new Animated.Value(Math.random() * 0.6 + 0.4), // More visible opacity
      scale: new Animated.Value(Math.random() * 0.8 + 0.6),
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    });

    const particleArray = Array.from({ length: 25 }, (_, i) => createParticle(i)); // More particles for visibility
    setParticles(particleArray);

    // Animate particles
    const animateParticle = (particle: Particle) => {
      const duration = Math.random() * 15000 + 10000; // Slower, more subtle movement
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.random() * dimensions.width,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.random() * dimensions.height,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.6 + 0.3,
            duration: duration / 3,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.3 + 0.1,
            duration: duration / 3,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animateParticle(particle));
    };

    particleArray.forEach(animateParticle);
  }, [dimensions, animationsEnabled]);
  return (
    <View style={styles.container} pointerEvents="none">
  
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0, // Behind content but above background
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.12,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
});