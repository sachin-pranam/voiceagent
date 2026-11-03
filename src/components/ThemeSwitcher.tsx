import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, themes } from "@/lib/theme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="size-8 px-0"
        onClick={() => setOpen(!open)}
      >
        <Palette className="size-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      
      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="size-4 rounded-full border border-border"
                    style={{ backgroundColor: themeOption.color }}
                  />
                  <span>{themeOption.label}</span>
                </div>
                {theme === themeOption.value && <Check className="size-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}