import './globals.css';
import { Providers } from './providers'; 

export const metadata = {
  title: "Minouverse",
  description: "The best social media"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
