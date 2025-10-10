import { getGlobalSettings } from '@/hooks/useSettings';
import { useEffect, useState } from "react";
import { Animated, Dimensions, Platform, StyleSheet, View } from 'react-native';

// Particle interface
interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

// Simple particle for web fallback
interface SimpleParticle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  color: string;
  velocityX: number;
  velocityY: number;
}

export default function BGAnimation() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [webParticles, setWebParticles] = useState<SimpleParticle[]>([]);
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Debug logging
  useEffect(() => {
    console.log('BGAnimation: Platform:', Platform.OS);
    console.log('BGAnimation: Dimensions:', dimensions);
    console.log('BGAnimation: Animations enabled:', animationsEnabled);
  }, [dimensions, animationsEnabled]);
  
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

  // Web-specific particle animation using requestAnimationFrame
  useEffect(() => {
    if (!animationsEnabled || Platform.OS !== 'web') {
      setWebParticles([]);
      return;
    }

    console.log('BGAnimation: Creating web particles');
    const particleColors = ["#8B5CF6"];
    const createWebParticle = (id: number): SimpleParticle => ({
      id,
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      opacity: Math.random() * 0.3 + 0.2,
      scale: Math.random() * 0.8 + 0.6,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      velocityX: (Math.random() - 0.5) * 0.5,
      velocityY: (Math.random() - 0.5) * 0.5,
    });

    const webParticleArray = Array.from({ length: 15 }, (_, i) => createWebParticle(i));
    setWebParticles(webParticleArray);
    console.log('BGAnimation: Created', webParticleArray.length, 'web particles');

    let animationFrame: number;
    
    const animateWebParticles = () => {
      setWebParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.velocityX + dimensions.width) % dimensions.width,
        y: (particle.y + particle.velocityY + dimensions.height) % dimensions.height,
        opacity: 0.2 + Math.sin(Date.now() * 0.001 + particle.id) * 0.1,
      })));
      
      animationFrame = requestAnimationFrame(animateWebParticles);
    };

    animationFrame = requestAnimationFrame(animateWebParticles);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [dimensions, animationsEnabled]);

  // Native particle animation for mobile
  useEffect(() => {
    if (!animationsEnabled || Platform.OS === 'web') {
      setParticles([]);
      return;
    }

    const particleColors = ["#8B5CF6"];
    const createParticle = (id: number): Particle => ({
      id,
      x: new Animated.Value(Math.random() * dimensions.width),
      y: new Animated.Value(Math.random() * dimensions.height),
      opacity: new Animated.Value(Math.random() * 0.6 + 0.4),
      scale: new Animated.Value(Math.random() * 0.8 + 0.6),
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    });

    const particleArray = Array.from({ length: 25 }, (_, i) => createParticle(i));
    setParticles(particleArray);

    // Animate particles
    const animateParticle = (particle: Particle) => {
      const duration = Math.random() * 15000 + 10000;
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.random() * dimensions.width,
          duration,
          useNativeDriver: false, // Keep false for better web compatibility
        }),
        Animated.timing(particle.y, {
          toValue: Math.random() * dimensions.height,
          duration,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.6 + 0.3,
            duration: duration / 3,
            useNativeDriver: false,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.3 + 0.1,
            duration: duration / 3,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => animateParticle(particle));
    };

    particleArray.forEach(animateParticle);
  }, [dimensions, animationsEnabled]);
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Debug: Simple colored div for web to test visibility */}
      {Platform.OS === 'web' && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 20,
            height: 20,
            backgroundColor: '#8B5CF6',
            borderRadius: 10,
            opacity: 0.8,
            zIndex: 999,
          }}
        />
      )}
      
      {/* Native particles for mobile */}
      {animationsEnabled && Platform.OS !== 'web' && particles.map((particle) => (
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
      
      {/* Web particles using regular Views */}
      {animationsEnabled && Platform.OS === 'web' && webParticles.map((particle) => (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              left: particle.x,
              top: particle.y,
              opacity: particle.opacity,
              transform: [{ scale: particle.scale }],
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
    zIndex: 1, // Ensure it's above the background but below content
    pointerEvents: 'none', // Allow interactions to pass through
  },
  particle: {
    position: "absolute",
    width: Platform.OS === 'web' ? 12 : 8, // Slightly larger on web for visibility
    height: Platform.OS === 'web' ? 12 : 8,
    borderRadius: Platform.OS === 'web' ? 6 : 4,
    opacity: Platform.OS === 'web' ? 0.25 : 0.12, // More visible on web
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: Platform.OS === 'web' ? 0.4 : 0.2, // More shadow on web
    shadowRadius: Platform.OS === 'web' ? 4 : 2,
    elevation: Platform.OS === 'web' ? 2 : 1,
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)',
    }),
  },
});