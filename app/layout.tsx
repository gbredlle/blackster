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
      <body>{children}</body>
    </html>
  );
}
