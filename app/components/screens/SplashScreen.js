// app/components/SplashScreen.js
import { Image, StyleSheet, View } from 'react-native';

export default function AnimatedSplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('../../../assets/images/WorldSprings_logo_1.png')}
        resizeMode="contain"
      />
      <WordSpringsText style={{ fontSize: 48, paddingTop: 20 }}> 
        WORD SPRINGS
      </WordSpringsText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6757f7', // Your spring green
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200, // <-- THIS IS THE KEY! You have full control.
    height: 200, // Adjust as needed
  },
});