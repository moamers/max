import { Tabs } from "expo-router";
import { useAppTheme } from "../src/theme";

export default function RootLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.seriesBills,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textPrimary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Upload" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
    </Tabs>
  );
}
