import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faSearch, 
  faHistory, 
  faStar, 
  faBell, 
  faEnvelope, 
  faChartBar, 
  faCalendarAlt, 
  faPlusCircle 
} from "@fortawesome/free-solid-svg-icons";

const Sidebar = () => {
  return (
    <aside className="w-64 h-[calc(100vh-76px)] bg-[#1b1b1b] p-6 fixed left-0 top-[96px] hidden md:block border-r border-[#333] z-10">
      <ul className="space-y-6 text-sm">
        {[
          { icon: faUser, label: "Profil" },
          { icon: faSearch, label: "Recherche" },
          { icon: faHistory, label: "Historique" },
          { icon: faStar, label: "Favoris" },
          { icon: faBell, label: "Notifications" },
          { icon: faEnvelope, label: "Messages" },
          { icon: faChartBar, label: "Sondages" },
          { icon: faCalendarAlt, label: "Événements" },
        ].map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-3 hover:text-[#90EE90] cursor-pointer transition-all duration-300 text-gray-300"
          >
            <FontAwesomeIcon icon={item.icon} className="text-lg" />
            <span>{item.label}</span>
          </li>
        ))}
        <li>
          <button className="w-full mt-4 bg-[#90EE90] text-black py-2 rounded-full font-semibold hover:bg-[#7CD37C] flex items-center justify-center gap-2 transition-all duration-300">
            <FontAwesomeIcon icon={faPlusCircle} />
            Poster
          </button>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;