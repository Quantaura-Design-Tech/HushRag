import "./globals.css";

export const metadata = {
  title: "HushRag - Private RAG for Your Documents",
  description: "Self-hosted, zero-knowledge RAG platform. Connect your own database, keep your data yours.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/images/logo-icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
