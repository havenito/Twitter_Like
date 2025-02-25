import "./globals.css";
import Sidebar from "./ui/Layout/Sidebar/Sidebar";
import Footer from "./ui/Layout/Footer/Footer";

export const metadata = {
  title: "Minouverse",
  description: "The best social media",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr-FR">
      <body className="flex flex-col min-h-screen relative">
        <Sidebar />
        <div className="flex-grow ml-64">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
