import Header from '../../components/Home/Header/Header';
import Footer from '../../components/Footer';

export default function HomeLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white flex flex-col">
      <Header />
      <main className="flex flex-1 pt-[76px]"> 
        {children} 
      </main>
      <Footer />
    </div>
  );
}