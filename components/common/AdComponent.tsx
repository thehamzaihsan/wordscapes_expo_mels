import { useTheme } from '@/hooks/useTheme';
import { StyleSheet, Text, View } from 'react-native';

const AdComponent = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>Ad Placeholder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    maxWidth: 500,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 0,
    marginVertical: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdComponent;
