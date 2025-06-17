"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HomeCard from "@/components/Main/Home/HomeCard";
import {
  faUser,
  faStar,
  faChartBar,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90]"></div>
      </div>
    );
  }

  // Générer les cartes avec l'URL du profil dynamique
  const cards = [
    {
      icon: faUser,
      title: "Profil",
      description: "Accédez à votre profil pour gérer vos informations, vos posts et vos interactions.",
      href: session?.user?.pseudo ? `/${session.user.pseudo}` : "/profile",
      button: "Voir le profil",
    },
    {
      icon: faStar,
      title: "Premium",
      description: "Débloquez des fonctionnalités exclusives, des thèmes personnalisés et profitez d'une expérience sans publicité.",
      href: "/premium",
      button: "Découvrir Premium",
    },
    {
      icon: faChartBar,
      title: "Sondages",
      description: "Participez aux sondages de la communauté ou créez les vôtres pour recueillir des avis.",
      href: "/polls",
      button: "Voir les sondages",
    },
    {
      icon: faSearch,
      title: "Recherche",
      description: "Trouvez des utilisateurs, des catégories ou des posts grâce à notre moteur de recherche intelligent.",
      href: "/search",
      button: "Rechercher",
    },
  ];

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col items-center">
      <main className="w-full max-w-5xl px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#90EE90] mb-12 text-center drop-shadow-lg">
          Bienvenue {session?.user?.first_name ? session.user.first_name : session?.user?.pseudo || session?.user?.email} 👋
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {cards.map((card, idx) => (
            <HomeCard key={card.title} {...card} delay={idx * 0.1} />
          ))}
        </div>
      </main>
    </div>
  );
}