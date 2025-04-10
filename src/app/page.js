import React from "react";
import HomeHeader from "./ui/Layout/Header/HomeHeader";
import Footer from "./ui/Layout/Footer/Footer";
import Carousel from "./components/Caroussel";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white flex flex-col">
      {/* Header at the top with only login/register buttons */}
      <HomeHeader />
      
      {/* Main content section with centered carousel */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <Carousel />
      </main>
      
      {/* Footer at the bottom */}
      <Footer />
    </div>
  );
}
