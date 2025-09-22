import { Redirect } from 'expo-router';

export default function Index() {
  // Use Redirect component instead of programmatic navigation
  return <Redirect href="/login" />;
}