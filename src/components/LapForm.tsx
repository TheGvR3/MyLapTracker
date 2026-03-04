import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "../lib/firebase";
import Link from "next/link";

interface LapFormProps {
  user: User | null;
  isAdmin: boolean;
  onTempoSalvato: () => void; // Funzione per dire alla home di ricaricare i tempi
}

export default function LapForm({
  user,
  isAdmin,
  onTempoSalvato,
}: LapFormProps) {
  const [categoria, setCategoria] = useState<"SIMRACING" | "REALTIME">(
    "SIMRACING",
  );
  const [piattaforma, setPiattaforma] = useState("");
  const [pilota, setPilota] = useState("");
  const [tempo, setTempo] = useState("");
  const [salvataggio, setSalvataggio] = useState(false);
  const [pista, setPista] = useState("");
  const [auto, setAuto] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [giochiDisponibili, setGiochiDisponibili] = useState<string[]>([]);
  const [suggerimentiGlobali, setSuggerimentiGlobali] = useState<{
    piste: string[];
    auto: string[];
  }>({ piste: [], auto: [] });

  useEffect(() => {
    const fetchGiochi = async () => {
      try {
        const docRef = doc(db, "configurazioni", categoria);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const giochi = docSnap.data().giochi || [];
          setGiochiDisponibili(
            giochi.sort((a: string, b: string) => a.localeCompare(b)),
          );
        } else {
          setGiochiDisponibili([]);
        }
        setPiattaforma("");
      } catch (error) {
        console.error("Errore giochi:", error);
      }
    };
    fetchGiochi();
  }, [categoria]);

  useEffect(() => {
    const fetchSuggerimenti = async () => {
      try {
        const docRef = doc(db, "configurazioni", "GLOBALE");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSuggerimentiGlobali({
            piste: (data.piste || []).sort((a: string, b: string) =>
              a.localeCompare(b),
            ),
            auto: (data.auto || []).sort((a: string, b: string) =>
              a.localeCompare(b),
            ),
          });
        }
      } catch (error) {
        console.error("Errore suggerimenti:", error);
      }
    };
    fetchSuggerimenti();
  }, []);

  useEffect(() => {
    setPista("");
    setAuto("");
  }, [piattaforma]);

  const handleSalvaTempo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvataggio(true);

    try {
      let ms = 0;
      let tempoPulito = tempo.replace(":", ".").trim();
      const parti = tempoPulito.split(".");

      if (parti.length === 3) {
        ms =
          (parseInt(parti[0]) || 0) * 60000 +
          (parseInt(parti[1]) || 0) * 1000 +
          (parseInt(parti[2].padEnd(3, "0")) || 0);
      } else if (parti.length === 2) {
        ms =
          (parseInt(parti[0]) || 0) * 1000 +
          (parseInt(parti[1].padEnd(3, "0")) || 0);
      } else {
        throw new Error("Formato tempo non valido");
      }

      const trackToSave = pista.trim();
      const carToSave = auto.trim();
      let nomePilotaCorretto = pilota;
      if (!isAdmin || categoria === "SIMRACING") {
        nomePilotaCorretto =
          user?.displayName || user?.email || "Pilota Ignoto";
      }

      if (trackToSave || carToSave) {
        await setDoc(
          doc(db, "configurazioni", "GLOBALE"),
          {
            ...(trackToSave && { piste: arrayUnion(trackToSave) }),
            ...(carToSave && { auto: arrayUnion(carToSave) }),
          },
          { merge: true },
        );

        await setDoc(
          doc(db, "associazioni_giochi", piattaforma),
          {
            ...(trackToSave && { piste: arrayUnion(trackToSave) }),
            ...(carToSave && { auto: arrayUnion(carToSave) }),
          },
          { merge: true },
        );

        setSuggerimentiGlobali((prev) => {
          const nuovePiste = prev.piste.includes(trackToSave)
            ? prev.piste
            : [...prev.piste, trackToSave];
          const nuoveAuto = prev.auto.includes(carToSave)
            ? prev.auto
            : [...prev.auto, carToSave];
          return { piste: nuovePiste.sort(), auto: nuoveAuto.sort() };
        });
      }

      await addDoc(collection(db, "tempi"), {
        categoria,
        game: piattaforma,
        track: trackToSave,
        car: carToSave,
        userName: nomePilotaCorretto,
        timeMs: ms,
        userId: user?.uid,
        isPrivate: isPrivate, // <--- SALVIAMO LA PRIVACY
        inseritoIl: new Date().toISOString(),
      });

      setTempo("");
      setPilota("");
      setPista("");
      setAuto("");
      onTempoSalvato(); // Avvisa la HomePage di ricaricare la classifica!
    } catch (error) {
      console.error(error);
      alert("Errore durante il salvataggio.");
    } finally {
      setSalvataggio(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center mb-10">
        <p className="text-slate-400 mb-4">
          Vuoi registrare i tuoi record personali e scalare la classifica?
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded font-bold transition-colors border border-slate-700"
        >
          Accedi per registrare un tempo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800 shadow-xl mb-10">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-[#6db029]">
        Registra nuovo tempo
      </h2>
      <form onSubmit={handleSalvaTempo} className="space-y-5">
        {isAdmin && (
          <div className="flex gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setCategoria("SIMRACING")}
              className={`flex-1 py-2 rounded font-bold transition-all ${categoria === "SIMRACING" ? "bg-[#6db029] text-white" : "text-slate-500 hover:text-white"}`}
            >
              🎮 Simracing
            </button>
            <button
              type="button"
              onClick={() => setCategoria("REALTIME")}
              className={`flex-1 py-2 rounded font-bold transition-all ${categoria === "REALTIME" ? "bg-amber-600 text-white" : "text-slate-500 hover:text-white"}`}
            >
              👑 Real World
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
              {isAdmin && categoria === "REALTIME"
                ? "Campionato"
                : "Simulatore"}
            </label>
            <select
              required
              value={piattaforma}
              onChange={(e) => setPiattaforma(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg focus:border-[#6db029] outline-none text-white appearance-none"
            >
              <option value="">-- Seleziona --</option>
              {giochiDisponibili.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Pilota
            </label>
            <input
              required
              value={
                !isAdmin || categoria === "SIMRACING"
                  ? user.displayName || user.email || ""
                  : pilota
              }
              onChange={(e) => setPilota(e.target.value)}
              readOnly={!isAdmin || categoria === "SIMRACING"}
              className={`w-full border p-3 rounded-lg outline-none transition-colors ${!isAdmin || categoria === "SIMRACING" ? "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed" : "bg-slate-800 border-slate-700 text-white focus:border-amber-500"}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Pista
            </label>
            <input
              list="piste-suggerite"
              required
              disabled={!piattaforma}
              value={pista}
              onChange={(e) => setPista(e.target.value)}
              placeholder={
                piattaforma
                  ? "Inizia a scrivere..."
                  : "Seleziona prima il gioco"
              }
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg focus:border-[#6db029] outline-none text-white disabled:opacity-50 transition-colors"
            />
            <datalist id="piste-suggerite">
              {suggerimentiGlobali.piste.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Auto
            </label>
            <input
              list="auto-suggerite"
              required
              disabled={!piattaforma}
              value={auto}
              onChange={(e) => setAuto(e.target.value)}
              placeholder={
                piattaforma
                  ? "Inizia a scrivere..."
                  : "Seleziona prima il gioco"
              }
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg focus:border-[#6db029] outline-none text-white disabled:opacity-50 transition-colors"
            />
            <datalist id="auto-suggerite">
              {suggerimentiGlobali.auto.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
            Tempo Registrato
          </label>
          <input
            required
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            placeholder="es. 1:24.500 oppure 84.500"
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg focus:border-[#6db029] outline-none text-white font-mono text-xl md:text-2xl text-center md:text-left transition-colors"
          />
        </div>

        {/* CHECKBOX TEMPO PRIVATO */}
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-800 transition-colors">
          <input 
            type="checkbox" 
            checked={isPrivate} 
            onChange={(e) => setIsPrivate(e.target.checked)} 
            className="w-5 h-5 accent-amber-500 cursor-pointer"
          />
          <div>
            <span className="text-sm font-bold text-slate-300 block">Rendi questo tempo Privato 🔒</span>
            <span className="text-[10px] text-slate-500">Sarà visibile solo a te nella tua Dashboard personale.</span>
          </div>
        </label>

        <button
          type="submit"
          disabled={salvataggio}
          className={`w-full text-white font-bold py-4 rounded-lg transition-all shadow-lg active:scale-[0.98] ${isAdmin && categoria === "REALTIME" ? "bg-amber-600 hover:bg-amber-500" : "bg-[#6db029] hover:bg-[#5a9222]"} disabled:opacity-50`}
        >
          {salvataggio
            ? "Salvataggio..."
            : `Salva Record ${isAdmin && categoria === "REALTIME" ? "Mondiale" : "Simracing"}`}
        </button>
      </form>
    </div>
  );
}
