import { useColorScheme } from "react-native";
import { themeFor, type ThemeTokens } from "@max/shared";

export function useAppTheme(): ThemeTokens {
  const scheme = useColorScheme();
  return themeFor(scheme);
}
