export default function StatusPill({ status }) {
  let color = "bg-gray-400 text-gray-800";
  let label = "Inconnu";
  if (status === true) { color = "bg-green-500 text-green-100"; label = "Traité"; }
  else if (status === false) { color = "bg-yellow-400 text-yellow-800"; label = "En attente"; }
  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap max-w-fit ${color}`}>
      {label}
    </span>
  );
}