import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "TaskFlow", description: "Espaces de travail, projets et tableau Kanban" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
