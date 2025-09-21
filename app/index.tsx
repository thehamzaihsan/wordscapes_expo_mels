import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import Login from './components/Login';
import LevelScreen from './components/LevelScreen';
import GameScreen from './components/GameScreen';

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'levels', 'game'

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <Login onNavigate={setCurrentScreen} />;
      case 'levels':
        return <LevelScreen onNavigate={setCurrentScreen} />;
      case 'game':
        return <GameScreen onNavigate={setCurrentScreen} />;
      default:
        return <Login onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {renderScreen()}
    </SafeAreaView>
  );
}