import "./globals.css";

export const metadata = {
  title: "SkillCert AI",
  description: "AI-powered video learning, assessment and certification platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
