import { ArrowPathIcon, NoSymbolIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import StatusPill from "./StatusPill";
import TypePill from "./TypePill";

export default function ReportRow({ report, handleUpdateStatus, handleWarnUser, handleBanUser, handleUnbanUser, filter }) {
  return (
    <tr className="border-b border-[#333] hover:bg-[#1a1d22]/60 transition-colors">
      <td className="px-6 py-4">{report.id}</td>
      <td className="px-6 py-4 font-medium">{report.reporter_display || 'N/A'}</td>
      <td className="px-6 py-4">
        <TypePill type={report.report_type} />
      </td>
      <td className="px-6 py-4 max-w-xs truncate" title={report.content}>{report.content || '-'}</td>
      <td className="px-6 py-4 max-w-xs truncate flex items-center gap-2" title={report.contenu_signale_preview}>
        <span className="truncate">{report.contenu_signale_preview || 'Aucun'}</span>
        {report.post_id && (
          <a
            href={`/admin/reports/post/${report.post_id}`}
            className="ml-2 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow"
            title="Voir le post signalé"
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir
          </a>
        )}
      </td>
      <td className="px-6 py-4 font-medium">
        {report.reported_user_display ? report.reported_user_display : "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{report.date_signalement}</td>
      <td className="px-6 py-4">
        <StatusPill status={report.statut} />
      </td>
      <td className="px-6 py-4 text-center">{report.reported_user_warns ?? 0}</td>
      <td className="px-6 py-4">{report.reported_user_is_banned ? 'Oui' : 'Non'}</td>
      <td className="px-6 py-4 space-y-1 md:space-y-0 md:space-x-1 flex flex-col md:flex-row items-start">
        {report.statut === false ? (
          <button onClick={() => handleUpdateStatus(report.id, 'Traité')} className="flex items-center px-2.5 py-1.5 text-xs bg-gradient-to-r from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 rounded font-semibold text-black shadow transition-colors">
            <CheckCircleIcon className="w-4 h-4 mr-1" /> Traiter
          </button>
        ) : (
          <button onClick={() => handleUpdateStatus(report.id, 'En attente')} className="flex items-center px-2.5 py-1.5 text-xs bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 rounded font-semibold text-black shadow transition-colors">
            <ArrowPathIcon className="w-4 h-4 mr-1" /> En attente
          </button>
        )}
        {filter !== "Bannis" && (
          <button
            onClick={() => handleWarnUser(report.reported_user_id)}
            disabled={report.reported_user_warns >= 3 || report.reported_user_is_banned}
            className={`flex items-center px-2.5 py-1.5 text-xs bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 rounded font-semibold text-black shadow transition-colors
              ${report.reported_user_warns >= 3 || report.reported_user_is_banned ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" /> Warn
          </button>
        )}
        {report.reported_user_is_banned ? (
          <button
            onClick={() => handleUnbanUser(report.reported_user_id)}
            className="flex items-center px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 rounded font-semibold text-white shadow transition-colors"
          >
            <ArrowUturnLeftIcon className="w-4 h-4 mr-1" /> Déban
          </button>
        ) : (
          <button
            onClick={() => handleBanUser(report.reported_user_id)}
            className="flex items-center px-2.5 py-1.5 text-xs bg-gradient-to-r from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 rounded font-semibold text-white shadow transition-colors"
          >
            <NoSymbolIcon className="w-4 h-4 mr-1" /> Bannir
          </button>
        )}
      </td>
    </tr>
  );
}