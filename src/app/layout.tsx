import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { getOrgSettings } from "@/lib/queries/org-settings";
import { safeHexColor } from "@/lib/hex-color";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Branding is editable at runtime from Settings — every page depends on the
// CSS overrides injected below, so none of them can be statically prerendered
// with a build-time snapshot of the org's colors.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrgSettings();
  return {
    title: `${org.name} CRM`,
    description: `Internal CRM for ${org.name} — lead management & analytics`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const org = await getOrgSettings();
  // Re-validate on read, not just on write — this string is interpolated into
  // raw CSS below, so a bad DB row (bug, direct SQL edit) must never reach it.
  const primaryColor = safeHexColor(org.primaryColor, "#c2410c");
  const secondaryColor = safeHexColor(org.secondaryColor, "#0d9488");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Per-instance white-label brand colors — overrides the defaults in globals.css */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root, .dark { --brand-orange: ${primaryColor}; --brand-orange-dark: ${primaryColor}; --brand-teal: ${secondaryColor}; }`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
