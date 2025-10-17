import { Image, Platform, View } from 'react-native'

export default function BackgroundImage() {
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
          zIndex: 0,
          // @ts-ignore - web-specific styles
          backgroundImage: 'url(/images/default_background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    )
  }

  // Use Image component for mobile platforms
  return (
    <Image
      source={require('../../../images/default_background.jpg')}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 0
      }}
      resizeMode="cover"
    />
  )
}
