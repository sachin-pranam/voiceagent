import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "blue" | "green" | "purple";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Handle SSR/client mismatch
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = window.document.documentElement;
    
    // Remove all existing theme classes
    root.classList.remove("light", "dark", "theme-blue", "theme-green", "theme-purple");
    
    // Apply new theme
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "blue") {
      root.classList.add("theme-blue");
    } else if (theme === "green") {
      root.classList.add("theme-green");  
    } else if (theme === "purple") {
      root.classList.add("theme-purple");
    } else {
      root.classList.add("light");
    }
    
    console.log("Theme applied:", theme, "Classes:", root.className);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, theme);
      }
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

export const themes: { value: Theme; label: string; color: string }[] = [
  { value: "light", label: "Light", color: "#f8fafc" },
  { value: "dark", label: "Dark", color: "#0f172a" },
  { value: "blue", label: "Blue", color: "#1d4ed8" },
  { value: "green", label: "Green", color: "#059669" },
  { value: "purple", label: "Purple", color: "#7c3aed" },
];