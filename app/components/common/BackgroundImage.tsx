import { ImageBackground, Platform, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function BackgroundImage() {
  const { themeName } = useTheme();
  const isDark = themeName === 'dark' || themeName === 'game';

  const overlay = isDark ? (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    />
  ) : null;

  if (Platform.OS === 'web') {
    // Use CSS background-image for web - much more reliable
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          // @ts-ignore - web-specific styles
          backgroundImage: 'url(/images/default_background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {overlay}
      </View>
    );
  }

  // Use ImageBackground component for mobile platforms to support overlay
  return (
    <ImageBackground
      source={require('../../../images/default_background.jpg')}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: -1,
      }}
      resizeMode="cover"
    >
      {overlay}
    </ImageBackground>
  );
}
