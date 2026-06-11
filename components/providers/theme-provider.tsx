"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * Thin wrapper around next-themes ThemeProvider.
 * Must be "use client" — reads localStorage and manipulates the DOM class.
 * Placed here to keep app/layout.tsx as a pure RSC.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
