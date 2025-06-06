import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({ page, totalPages, setPage }) {
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <span className="text-base font-semibold">{page} / {totalPages || 1}</span>
      <button
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page === totalPages || totalPages === 0}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}