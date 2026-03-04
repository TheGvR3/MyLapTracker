import { useState, useMemo } from "react";
import { LapTime } from "../lib/types";
import { formatTime } from "../lib/utils";

interface LeaderboardProps {
  laps: LapTime[];
  onDelete?: (id: string) => void;
  onTogglePrivacy?: (id: string, isPrivate: boolean) => void;
  titolo?: string;
  itemsPerPage?: number; // Permette di personalizzare i record per pagina
}

export default function Leaderboard({ 
  laps, 
  onDelete, 
  onTogglePrivacy, 
  titolo = "Classifica Globale",
  itemsPerPage = 10 // Quanti tempi mostrare per pagina di default
}: LeaderboardProps) {
  
  // === STATI DEI FILTRI ===
  const [searchTerm, setSearchTerm] = useState(""); // Ricerca testuale libera
  const [filterGame, setFilterGame] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterCar, setFilterCar] = useState("");
  const [sortBy, setSortBy] = useState<"track" | "time">("track");
  
  // === STATO PAGINAZIONE ===
  const [currentPage, setCurrentPage] = useState(1);

  // Generazione dinamica delle tendine (basate sui dati attuali)
  const uniqueGames = useMemo(() => Array.from(new Set(laps.map(l => l.game))).sort((a, b) => a.localeCompare(b)), [laps]);
  const uniqueTracks = useMemo(() => Array.from(new Set(laps.map(l => l.track))).sort((a, b) => a.localeCompare(b)), [laps]);
  const uniqueCars = useMemo(() => Array.from(new Set(laps.map(l => l.car))).sort((a, b) => a.localeCompare(b)), [laps]);

  // === MAGIA: FILTRAGGIO + RICERCA TESTUALE + ORDINAMENTO ===
  const filteredAndSortedLaps = useMemo(() => {
    // 1. Filtri a tendina e Ricerca Libera
    const filtered = laps.filter((lap) => {
      // Filtri esatti (Tendine)
      const matchGame = filterGame === "" || lap.game === filterGame;
      const matchTrack = filterTrack === "" || lap.track === filterTrack;
      const matchCar = filterCar === "" || lap.car === filterCar;
      
      // Ricerca libera (Testo) - Cerca in tutti i campi principali
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = searchTerm === "" || 
        lap.userName.toLowerCase().includes(searchLower) ||
        lap.track.toLowerCase().includes(searchLower) ||
        lap.car.toLowerCase().includes(searchLower) ||
        lap.game.toLowerCase().includes(searchLower);

      return matchGame && matchTrack && matchCar && matchSearch;
    });

    // 2. Ordinamento (Pista o Tempo)
    return filtered.sort((a, b) => {
      if (sortBy === "track") {
        const trackCompare = a.track.localeCompare(b.track);
        if (trackCompare !== 0) return trackCompare;
        return a.timeMs - b.timeMs; // A parità di pista, il più veloce
      } else {
        return a.timeMs - b.timeMs; // Solo per tempo puro
      }
    });
  }, [laps, filterGame, filterTrack, filterCar, searchTerm, sortBy]);

  // === CALCOLO PAGINAZIONE ===
  const totalPages = Math.ceil(filteredAndSortedLaps.length / itemsPerPage);
  
  // Estrai solo i tempi della pagina corrente
  const currentLaps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLaps.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLaps, currentPage, itemsPerPage]);

  // === RESET E GESTIONE ===
  const hasFiltersAttivi = filterGame || filterTrack || filterCar || searchTerm;

  const resetFiltri = () => {
    setFilterGame(""); 
    setFilterTrack(""); 
    setFilterCar("");
    setSearchTerm("");
    setSortBy("track");
    setCurrentPage(1); // Se resetti, torni alla pagina 1
  };

  // Se i filtri cambiano, l'utente viene riportato a pagina 1 per non perdersi
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <h3 className="text-2xl font-bold text-white leading-none">{titolo}</h3>
        {hasFiltersAttivi && (
          <button onClick={resetFiltri} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded-full transition-colors border border-slate-700">
            ❌ Azzera Filtri
          </button>
        )}
      </div>

      {/* === PANNELLO CONTROLLI (Ricerca + Tendine) === */}
      {laps.length > 0 && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 space-y-3 shadow-inner">
          
          {/* Riga 1: Barra di Ricerca Libera */}
          <div>
            <input 
              type="text" 
              placeholder="🔍 Cerca pilota, auto, pista o gioco..." 
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-sm text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          {/* Riga 2: Griglia Filtri e Ordinamento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ordina per</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "track" | "time")} className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-indigo-300 font-bold focus:border-indigo-500 outline-none appearance-none cursor-pointer">
                <option value="track">Pista (A-Z)</option>
                <option value="time">Più Veloce</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Simulatore</label>
              <select value={filterGame} onChange={(e) => handleFilterChange(setFilterGame, e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer">
                <option value="">Tutti</option>
                {uniqueGames.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pista</label>
              <select value={filterTrack} onChange={(e) => handleFilterChange(setFilterTrack, e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer">
                <option value="">Tutte</option>
                {uniqueTracks.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Auto</label>
              <select value={filterCar} onChange={(e) => handleFilterChange(setFilterCar, e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer">
                <option value="">Tutte</option>
                {uniqueCars.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* === LISTA DEI TEMPI === */}
      <div className="space-y-3">
        {currentLaps.length > 0 ? (
          currentLaps.map((lap, index) => (
            <div key={lap.id} className="relative p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-700 transition-colors group overflow-hidden shadow-sm">
              
              {/* Effetto Medaglia (Mostrato solo sulla pagina 1 e se si filtra una pista specifica) */}
              {currentPage === 1 && filterTrack && index === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
              {currentPage === 1 && filterTrack && index === 1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400"></div>}
              {currentPage === 1 && filterTrack && index === 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-700"></div>}

              <div className="w-full sm:w-auto pl-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[#6db029] text-[10px] md:text-xs uppercase tracking-wider">{lap.game}</span>
                  <span className="text-[9px] md:text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{lap.userName}</span>
                  {lap.isPrivate && (
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="Visibile solo a te">
                      🔒 Privato
                    </span>
                  )}
                </div>
                <div className="text-white text-base md:text-lg font-bold leading-tight">{lap.track}</div>
                <div className="text-slate-500 text-xs">{lap.car}</div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <div className="font-mono text-xl md:text-2xl font-bold text-white tracking-tighter">
                  {formatTime(lap.timeMs)}
                </div>
                
                <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {onTogglePrivacy && (
                    <button 
                      onClick={() => onTogglePrivacy(lap.id, !!lap.isPrivate)}
                      className={`p-2 rounded-lg transition-colors border flex items-center justify-center ${lap.isPrivate ? "bg-emerald-900/30 text-emerald-500 hover:bg-emerald-600 hover:text-white border-emerald-900/50" : "bg-amber-900/30 text-amber-500 hover:bg-amber-600 hover:text-white border-amber-900/50"}`}
                      title={lap.isPrivate ? "Rendi Pubblico" : "Rendi Privato"}
                    >
                      {lap.isPrivate ? "👁️" : "🔒"}
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(lap.id)}
                      className="p-2 bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors border border-red-900/50 flex items-center justify-center"
                      title="Elimina questo record"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-lg">
            {laps.length > 0 ? "Nessun tempo corrisponde ai criteri di ricerca. 🕵️‍♂️" : "Nessun tempo registrato. Scendi in pista! 🏎️"}
          </div>
        )}
      </div>

      {/* === CONTROLLI PAGINAZIONE === */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            &larr; Precedente
          </button>
          
          <span className="text-slate-400 text-sm font-medium">
            Pagina <b className="text-white">{currentPage}</b> di <b className="text-white">{totalPages}</b>
          </span>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Successiva &rarr;
          </button>
        </div>
      )}
    </>
  );
}