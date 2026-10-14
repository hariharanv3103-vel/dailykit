import "./globals.css";

export const metadata = {
  title: "DailyKit — Everyday tools, all in one place",
  description: "Simple everyday tools for calculations, notes, tasks, PDFs and images.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
