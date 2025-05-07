import './globals.css';

export const metadata = {
  title: "Minouverse",
  description: "The best social media"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
