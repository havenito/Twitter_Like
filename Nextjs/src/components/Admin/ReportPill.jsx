export default function TypePill({ type }) {
  let color = "bg-gray-400 text-gray-800";
  switch (type?.toLowerCase()) {
    case 'spam': color = 'bg-blue-500 text-blue-100'; break;
    case 'contenu inapproprié': color = 'bg-pink-500 text-pink-100'; break;
    case 'usurpation d\'identité': color = 'bg-purple-500 text-purple-100'; break;
    case 'incitation à la haine': color = 'bg-red-500 text-white'; break;
    case 'autre': color = 'bg-gray-500 text-gray-100'; break;
    default: break;
  }
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap max-w-fit ${color}`}>
      {type}
    </span>
  );
}