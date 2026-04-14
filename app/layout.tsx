import React from "react";

export const metadata = {
  title: "Blackster DJ Pool",
  description: "Blackster DJ Pool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#000", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
