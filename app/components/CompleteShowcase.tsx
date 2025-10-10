/**
 * Complete Component Library Showcase
 * Demonstrates proper card padding and consistent button usage
 */

import React, { useState } from 'react';
import { View, ScrollView, Switch } from 'react-native';
import { Heart, Star, Settings, User, ShoppingCart } from 'lucide-react-native';
import { 
  ThemedCard, 
  ThemedText, 
  ThemedButton, 
  ThemedInput,
  ThemedModal,
  ThemeSwitcher,
  useTheme 
} from './ui-components';

const CompleteShowcase: React.FC = () => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.base }}>
        
        {/* Header - XL Padding */}
        <View style={{ marginBottom: theme.spacing.base }}>
          <ThemedCard padding="xl" variant="elevated">
            <ThemedText variant="heading1" align="center" weight="bold" color="primary">
              Wordscapes UI
            </ThemedText>
            <ThemedText variant="body1" align="center" color="textSecondary">
              Complete component library with proper spacing
            </ThemedText>
          </ThemedCard>
        </View>

        {/* Theme Switcher */}
        <View style={{ marginBottom: theme.spacing.base }}>
          <ThemeSwitcher />
        </View>

        {/* Button Showcase - LG Padding */}
        <View style={{ marginBottom: theme.spacing.base }}>
          <ThemedCard padding="lg" variant="default">
            <ThemedText variant="heading3" weight="semibold" style={{ marginBottom: theme.spacing.base }}>
              🎮 Game Actions
            </ThemedText>
            
            <ThemedButton
              title="Start New Game"
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Star size={20} color={theme.colors.textInverse} />}
              style={{ marginBottom: theme.spacing.md }}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
              <ThemedButton
                title="Profile"
                variant="secondary"
                size="md"
                leftIcon={<User size={16} color={theme.colors.textInverse} />}
                style={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <ThemedButton
                title="Shop"
                variant="warning"
                size="md"
                leftIcon={<ShoppingCart size={16} color={theme.colors.textInverse} />}
                style={{ flex: 1 }}
              />
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
              <ThemedButton
                title="Success"
                variant="success"
                size="sm"
                style={{ flex: 1, marginRight: theme.spacing.xs }}
              />
              <ThemedButton
                title="Outline"
                variant="outline"
                size="sm"
                style={{ flex: 1, marginRight: theme.spacing.xs }}
              />
              <ThemedButton
                title="Ghost"
                variant="ghost"
                size="sm"
                style={{ flex: 1 }}
              />
            </View>
            
            <ThemedButton
              title="Show Modal"
              variant="info"
              size="md"
              fullWidth
              onPress={() => setModalVisible(true)}
            />
          </ThemedCard>
        </View>

        {/* Form Example - LG Padding */}
        <View style={{ marginBottom: theme.spacing.base }}>
          <ThemedCard padding="lg" variant="outlined">
            <ThemedText variant="heading3" weight="semibold" style={{ marginBottom: theme.spacing.base }}>
              👤 User Profile
            </ThemedText>
            
            <ThemedInput
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              variant="outlined"
              leftIcon={<User size={16} color={theme.colors.textSecondary} />}
              style={{ marginBottom: theme.spacing.md }}
            />
            
            <ThemedInput
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              variant="filled"
              keyboardType="email-address"
              style={{ marginBottom: theme.spacing.lg }}
            />
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: theme.spacing.lg 
            }}>
              <ThemedText variant="body1" weight="medium">Enable Notifications</ThemedText>
              <Switch
                value={switchValue}
                onValueChange={setSwitchValue}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={switchValue ? theme.colors.textInverse : theme.colors.textTertiary}
              />
            </View>
            
            <ThemedButton
              title="Save Profile"
              variant="success"
              size="lg"
              fullWidth
              leftIcon={<Heart size={18} color={theme.colors.textInverse} />}
            />
          </ThemedCard>
        </View>

        {/* Game Stats - MD Padding */}
        <View style={{ marginBottom: theme.spacing.base }}>
          <ThemedCard padding="md" variant="flat">
            <ThemedText variant="heading4" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              📊 Game Statistics
            </ThemedText>
            <ThemedText variant="body2" color="textSecondary">
              This card uses medium padding (padding="md")
            </ThemedText>
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-around', 
              marginTop: theme.spacing.md 
            }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="heading2" weight="bold" color="primary">127</ThemedText>
                <ThemedText variant="caption" color="textSecondary">Games Won</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="heading2" weight="bold" color="warning">2,450</ThemedText>
                <ThemedText variant="caption" color="textSecondary">Total Points</ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="heading2" weight="bold" color="success">Level 15</ThemedText>
                <ThemedText variant="caption" color="textSecondary">Current Rank</ThemedText>
              </View>
            </View>
          </ThemedCard>
        </View>

        {/* Quick Actions - SM Padding */}
        <View style={{ marginBottom: theme.spacing.base }}>
          <ThemedCard padding="sm" variant="elevated">
            <ThemedText variant="body2" align="center" color="textSecondary">
              Small padding card (padding="sm") for compact content
            </ThemedText>
          </ThemedCard>
        </View>

        {/* Settings Panel - LG Padding */}
        <View style={{ marginBottom: theme.spacing.base }}>
          <ThemedCard padding="lg" variant="default">
            <ThemedText variant="heading3" weight="semibold" style={{ marginBottom: theme.spacing.base }}>
              ⚙️ Quick Settings
            </ThemedText>
            
            <ThemedButton
              title="Game Settings"
              variant="outline"
              size="md"
              fullWidth
              leftIcon={<Settings size={18} color={theme.colors.primary} />}
              style={{ marginBottom: theme.spacing.sm }}
            />
            
            <ThemedButton
              title="Reset Progress"
              variant="error"
              size="md"
              fullWidth
              style={{ marginBottom: theme.spacing.sm }}
            />
            
            <ThemedButton
              title="Export Data"
              variant="ghost"
              size="sm"
              fullWidth
            />
          </ThemedCard>
        </View>

        {/* Modal Demo */}
        <ThemedModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Component Demo"
          subtitle="This modal uses proper ThemedCard padding"
          size="medium"
          showCloseButton
          backdrop="blur"
        >
          <ThemedText variant="body1" style={{ marginBottom: theme.spacing.lg }}>
            This modal demonstrates the proper use of:
          </ThemedText>
          
          <ThemedText variant="body2" style={{ marginBottom: theme.spacing.sm }}>
            • ThemedCard with consistent padding options (sm, md, lg, xl)
          </ThemedText>
          <ThemedText variant="body2" style={{ marginBottom: theme.spacing.sm }}>
            • ThemedButton with all variants and sizes
          </ThemedText>
          <ThemedText variant="body2" style={{ marginBottom: theme.spacing.lg }}>
            • Proper spacing using theme.spacing values
          </ThemedText>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedButton
              title="Cancel"
              variant="outline"
              size="md"
              onPress={() => setModalVisible(false)}
              style={{ flex: 1, marginRight: theme.spacing.sm }}
            />
            <ThemedButton
              title="Confirm"
              variant="primary"
              size="md"
              onPress={() => setModalVisible(false)}
              style={{ flex: 1 }}
            />
          </View>
        </ThemedModal>

      </View>
    </ScrollView>
  );
};

export default CompleteShowcase;