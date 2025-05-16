import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white px-4">
      <h1 className="text-6xl font-extrabold text-[#90EE90] mb-4">
        404
      </h1>
      <h2 className="text-3xl font-semibold mb-6">
        Page Non Trouvée
      </h2>
      <p className="text-lg text-gray-400 mb-8 text-center max-w-md">
        Oups ! Il semble que la page que vous cherchez se soit perdue dans le Minouverse.
      </p>
      <Link href="/">
        <button className="bg-[#90EE90] text-black px-6 py-3 rounded-full font-bold hover:bg-[#7CD37C] transition-all duration-300 shadow-lg hover:shadow-xl">
          Retourner à l'accueil
        </button>
      </Link>
    </div>
  );
}