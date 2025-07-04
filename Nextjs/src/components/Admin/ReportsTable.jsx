import ReportRow from "./ReportRow";

export default function ReportsTable({
  reports,
  handleUpdateStatus,
  handleWarnUser,
  handleBanUser,
  handleUnbanUser,
  filter
}) {
  return (
    <div className="overflow-x-auto bg-[#23272f] rounded-2xl shadow-2xl border border-[#23272f]/60">
      <table className="w-full min-w-[1100px] text-sm text-left">
        <thead className="bg-[#23272f] text-xs uppercase tracking-wider border-b border-[#333]">
          <tr>
            {[
              'ID',
              'Utilisateur',
              'Type',
              'Contenu',
              'Contenu signalé',
              'Utilisateur signalé',
              'Date',
              'Statut',
              'Warns',
              'Banni',
              'Actions'
            ].map(header => (
              <th key={header} scope="col" className="px-6 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.length > 0 ? (
            reports.map(report => (
              <ReportRow
                key={report.id}
                report={report}
                handleUpdateStatus={handleUpdateStatus}
                handleWarnUser={handleWarnUser}
                handleBanUser={handleBanUser}
                handleUnbanUser={handleUnbanUser}
                filter={filter}
              />
            ))
          ) : (
            <tr>
              <td colSpan="11" className="text-center py-8 text-gray-400">Aucun signalement à afficher.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}