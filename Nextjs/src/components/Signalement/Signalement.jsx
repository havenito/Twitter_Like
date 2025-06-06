import { Dialog, Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

const motifs = [
  "Harcèlement",
  "Incitation à la haine",
  "Spam",
  "Usurpation d'identité",
  "Contenu inapproprié",
  "Autre"
];

// Toast moderne avec icône et croix de fermeture
function Toast({ message, onClose }) {
  return (
    <div className="fixed top-8 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-3 bg-green-300 text-black px-6 py-3 rounded-xl shadow-2xl text-base font-semibold animate-fade-in-pop border border-green-400 min-w-[260px]">
      <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#22c55e" />
        <path d="M9.5 12.5l2 2 3-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-green-900 hover:text-green-700 text-xl font-bold focus:outline-none"
        aria-label="Fermer"
        tabIndex={0}
      >
        ×
      </button>
    </div>
  );
}

export default function Signalement({ isOpen, onClose, userId, postId }) {
  const [motif, setMotif] = useState(motifs[0]);
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/signalement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        post_id: postId,
        report_type: motif,
        content: details
      })
    });
    if (res.ok) setStatus('Signalement envoyé !');
    else setStatus('Erreur lors de l\'envoi');
    setTimeout(() => {
      setStatus('');
      setMotif(motifs[0]);
      setDetails('');
      onClose();
    }, 1500);
  };

  return (
    <>
      {status === 'Signalement envoyé !' && (
        <Toast message={status} onClose={() => setStatus('')} />
      )}

      <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-all duration-300" />
        <div className="relative bg-[#23272f] shadow-2xl rounded-2xl p-8 w-full max-w-lg mx-auto flex flex-col border border-[#23272f]/60">
          <Dialog.Title className="text-3xl font-extrabold text-green-400 mb-2 tracking-tight drop-shadow-lg">
            <span className="flex items-center gap-2">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#34d399" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16A8 8 0 0 0 12 4Zm1 4v4.59l3.3 3.3-1.42 1.42L11 13V8h2Z"/></svg>
              Signaler
            </span>
          </Dialog.Title>
          <p className="text-gray-400 mb-6 text-sm">Merci de contribuer à la sécurité de la plateforme.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block font-semibold text-gray-200 mb-2">Type de signalement</label>
              <Listbox value={motif} onChange={setMotif}>
                <div className="relative">
                  <Listbox.Button className="w-full rounded-lg bg-[#18191c] text-white border border-[#333] px-4 py-3 flex justify-between items-center shadow focus:ring-2 focus:ring-green-400 transition-all">
                    <span>{motif}</span>
                    <ChevronUpDownIcon className="h-5 w-5 text-green-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-2 w-full bg-[#23272f] border border-[#333] rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in">
                    {motifs.map((m) => (
                      <Listbox.Option
                        key={m}
                        value={m}
                        className={({ active, selected }) =>
                          `cursor-pointer select-none px-5 py-3 text-base transition-all
                          ${active ? 'bg-green-400/20 text-green-300' : 'text-gray-100'}
                          ${selected ? 'font-bold' : ''}`
                        }
                      >
                        {m}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
            <div>
              <label className="block font-semibold text-gray-200 mb-2">Détails</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Expliquez le problème…"
                className="w-full rounded-lg bg-[#18191c] text-white border border-[#333] px-4 py-3 min-h-[90px] focus:outline-none focus:ring-2 focus:ring-green-400 resize-none shadow transition-all placeholder-gray-500"
              />
            </div>
            <div className="flex justify-end gap-4 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-gray-800 text-gray-200 font-semibold hover:bg-gray-700 transition-all shadow"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-500 text-black font-bold shadow-lg hover:from-green-300 hover:to-green-400 transition-all"
              >
                Signaler
              </button>
            </div>
          </form>
        </div>
        <style jsx global>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease;
          }
          @keyframes fade-in-pop {
            0% { opacity: 0; transform: translateY(-20px) scale(0.95);}
            60% { opacity: 1; transform: translateY(0) scale(1.03);}
            100% { opacity: 1; transform: translateY(0) scale(1);}
          }
          .animate-fade-in-pop {
            animation: fade-in-pop 0.5s cubic-bezier(.4,2,.6,1) both;
          }
        `}</style>
      </Dialog>
    </>
  );
}