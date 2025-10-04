import { ChevronLeft, Play, Settings } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Logo from './logo';

const { width, height } = Dimensions.get('window');
// Particle interface
interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface LetterTileProps {
  letter: string;
  size?: 'large' | 'small';
  index: number;
}

interface LoginScreenProps {
  onNavigate: (screen: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Create floating particles
  useEffect(() => {
    const particleColors = ['#8B5CF6', '#EF4444', '#F59E0B', '#10B981']; // Purple, Red, Yellow, Green
    
    const createParticle = (id: number): Particle => ({
      id,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    });

    const particleArray = Array.from({ length: 20 }, (_, i) => createParticle(i));
    setParticles(particleArray);

    // Animate particles
    const animateParticle = (particle: Particle) => {
      const duration = Math.random() * 10000 + 8000;
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.random() * width,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.random() * height,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: Math.random() * 0.3 + 0.1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => animateParticle(particle));
    };

    particleArray.forEach(animateParticle);
  }, []);

  const handlePlayClick = (): void => {
    setShowLogin(true);
  };

  const handleBackClick = (): void => {
    setShowLogin(false);
    setEmail('');
    setPassword('');
  };

  const handleLogin = (): void => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Login successful!');
    }, 2000);
  };

  const handleGuestLogin = (): void => {
  onNavigate('levels');
  };

  const handleForgotPassword = (): void => {
    Alert.alert('Forgot Password', 'Password reset link would be sent to your email');
  };

  const handleCreateAccount = (): void => {
    Alert.alert('Create Account', 'Redirecting to sign up...');
  };

  const getTileColors = (index: number): string => {
    const colors = ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];
    return colors[index % colors.length];
  };

  const LetterTile: React.FC<LetterTileProps> = ({ letter, size = 'large', index }) => {
    const tileSize = size === 'large' ? 60 : 40;
    const fontSize = size === 'large' ? 24 : 18;
    
    return (
      <View
        style={[
          styles.letterTile,
          {
            width: tileSize,
            height: tileSize,
            backgroundColor: getTileColors(index),
          },
        ]}
      >
        <Text style={[styles.letterText, { fontSize }]}>{letter}</Text>
      </View>
    );
  };

  const renderFloatingParticles = () => (
    <View style={StyleSheet.absoluteFillObject}>
      {particles.map(particle => (
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

  const renderMainMenu = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121213" />
      {renderFloatingParticles()}
      
      <View style={styles.mainContent}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoSection}>
            {/* <View style={styles.letterRow}>
              {['W', 'O', 'R', 'D', 'S'].map((letter, index) => (
                <LetterTile key={index} letter={letter} index={index} />
              ))}
            </View>
            <View style={styles.letterRow}>
              {['C', 'A', 'P', 'E', 'S'].map((letter, index) => (
                <LetterTile key={index + 5} letter={letter} index={index + 5} />
              ))}
            </View>
            <View style={styles.betaTag}>
              <Text style={styles.betaText}>BETA</Text>
            </View> */}
            <Logo />
          </View>
        </View>

        {/* Menu Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handlePlayClick} style={styles.primaryButton}>
            <Play  size={18} color={'white'}/>
            <Text style={styles.primaryButtonText}> Play Game</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => Alert.alert('Settings', 'Settings menu')} style={styles.secondaryButton}>
            <Settings size={18} color={'white'} />
            <Text style={styles.secondaryButtonText}> Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderLoginScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121213" />
      {renderFloatingParticles()}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
          <ChevronLeft size={16} color={"#8B5CF6"} /> 
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Compact Logo */}
        <View style={styles.compactLogoContainer}>
          <Logo />
        </View>

        {/* Login Form */}
        <View style={styles.loginForm}>
          <Text style={styles.loginTitle}>LOGIN TO PLAY</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#6B7280"
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            onPress={handleLogin} 
            disabled={isLoading}
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'CONNECTING...' : 'LOGIN'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Guest Login */}
        <TouchableOpacity onPress={handleGuestLogin} style={styles.guestButton}>
          <Text style={styles.guestButtonText}>CONTINUE AS GUEST</Text>
        </TouchableOpacity>

        {/* Create Account */}
        <View style={styles.createAccountContainer}>
          <Text style={styles.createAccountText}>New player? </Text>
          <TouchableOpacity onPress={handleCreateAccount}>
            <Text style={styles.createAccountLink}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return showLogin ? renderLoginScreen() : renderMainMenu();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121213',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoSection: {
    alignItems: 'center',
    position: 'relative',
  },
  letterRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'center',
  },
  letterTile: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  letterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  betaTag: {
    position: 'absolute',
    top: -10,
    right: -30,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    transform: [{ rotate: '15deg' }],
  },
  betaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,

  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',

  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  compactLogoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  compactLetterRow: {
    flexDirection: 'row',
    marginBottom: 4,
    justifyContent: 'center',
  },
  loginForm: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#374151',
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  loginButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  loginButtonDisabled: {
    backgroundColor: '#4B5563',
    borderColor: '#6B7280',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  createAccountLink: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default LoginScreen;