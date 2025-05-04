import Image from 'next/image';
import Link from 'next/link';

const LandingHeader = () => {
  return (
    <header className="flex items-center justify-between px-8 py-6 bg-[#1b1b1b] border-b border-[#333] z-20">
      <div className="flex items-center justify-center">
        <Link href="/">
          <Image src="/minouverselogo.png" alt="Logo" width={60} height={60} className="rounded-full" />
        </Link>
      </div>
      
      <div className="flex gap-4">
        <>
          <Link href="/register">
            <button className="bg-[#333] text-gray-300 px-5 py-2 rounded-full hover:bg-[#444] hover:text-white transition-all duration-300">
              Inscription
            </button>
          </Link>
          <Link href="/login">
            <button className="bg-[#90EE90] text-black px-5 py-2 rounded-full hover:bg-[#7CD37C] transition-all duration-300">
              Connexion
            </button>
          </Link>
        </>
      </div>
    </header>
  );
};

export default LandingHeader;