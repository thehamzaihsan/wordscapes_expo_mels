import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  StatusBar,
} from 'react-native';
import { ChevronLeft, Settings as SettingsIcon } from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';
import { showToast } from '@/lib/toast';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { settings, updateSetting, resetSettings, loading } = useSettings();

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value);
    showToast(
      `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${value ? 'enabled' : 'disabled'}`,
      'info'
    );
  };

  const handleReset = () => {
    resetSettings();
    showToast('Settings reset to default', 'success');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121213" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121213" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onNavigate('back')}
          style={styles.backButton}
        >
          <ChevronLeft size={16} color={'white'} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <SettingsIcon size={24} color={'#8B5CF6'} />
          <Text style={styles.titleText}>Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Animation Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Animations</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Background Animations</Text>
              <Text style={styles.settingDescription}>
                Floating bubble animations in the background
              </Text>
            </View>
            <Switch
              value={settings.backgroundAnimationsEnabled}
              onValueChange={(value) => handleToggle('backgroundAnimationsEnabled', value)}
              trackColor={{ false: '#374151', true: '#8B5CF6' }}
              thumbColor={settings.backgroundAnimationsEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>UI Animations</Text>
              <Text style={styles.settingDescription}>
                Button presses, transitions, and other UI animations
              </Text>
            </View>
            <Switch
              value={settings.animationsEnabled}
              onValueChange={(value) => handleToggle('animationsEnabled', value)}
              trackColor={{ false: '#374151', true: '#8B5CF6' }}
              thumbColor={settings.animationsEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Audio</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sound Effects</Text>
              <Text style={styles.settingDescription}>
                Game sounds, button clicks, and audio feedback
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              trackColor={{ false: '#374151', true: '#8B5CF6' }}
              thumbColor={settings.soundEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Feedback Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📳 Feedback</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibration feedback for actions and interactions
              </Text>
            </View>
            <Switch
              value={settings.hapticFeedbackEnabled}
              onValueChange={(value) => handleToggle('hapticFeedbackEnabled', value)}
              trackColor={{ false: '#374151', true: '#8B5CF6' }}
              thumbColor={settings.hapticFeedbackEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Reset Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Reset</Text>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>Reset to Default Settings</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Wordscapes Game</Text>
            <Text style={styles.infoSubtext}>Version 1.0.0</Text>
            <Text style={styles.infoSubtext}>
              Configure your game experience with these settings
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'rgba(31,41,55,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55,65,81,0.85)',
    paddingEnd: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    marginRight: 80, // Offset for back button
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    backgroundColor: 'rgba(31,41,55,0.85)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SettingsScreen;