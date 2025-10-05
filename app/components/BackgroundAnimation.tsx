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
  // Handle dimension changes (e.g., device rotation)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Create floating particles
  useEffect(() => {
    const particleColors = ["#8B5CF6", "#EF4444", "#F59E0B", "#10B981"];
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
  }, [dimensions]);
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
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.1,
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
});