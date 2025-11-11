import { useTheme } from '@/hooks/useTheme';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  hidden?: boolean;
}

const AdComponent: React.FC<Props> = ({ hidden }) => {
  const { theme } = useTheme();
  if (hidden) return null;
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>Ad Placeholder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    maxWidth: 728,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdComponent;
