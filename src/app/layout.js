import "./globals.css";

export const metadata = {
  title: "HushRag - E2EE Employee Policy Bot Platform",
  description: "Secure, zero-knowledge RAG chat bot platform for corporate policies, benefits, and support guidelines.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
