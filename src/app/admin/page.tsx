"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "../../lib/firebase"; 
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [caricamento, setCaricamento] = useState(true);
  const [tabAttivo, setTabAttivo] = useState<"SIMRACING" | "REALTIME">("SIMRACING");

  // Stati per i nuovi inserimenti nelle liste
  const [nuovoGioco, setNuovoGioco] = useState("");
  const [nuovaPista, setNuovaPista] = useState("");
  const [nuovaAuto, setNuovaAuto] = useState("");

  // Stati per leggere i dati attuali dal DB
  const [listeGlobali, setListeGlobali] = useState<{
    giochi: string[];
    piste: string[];
    auto: string[];
  }>({ giochi: [], piste: [], auto: [] });

  // 1. Controllo Sicurezza (Solo Admin)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "utenti", user.uid));
        if (userDoc.exists() && userDoc.data().ruolo === "admin") {
          setCaricamento(false);
        } else {
          router.push("/");
        }
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Scarica le liste globali all'apertura o al cambio tab e le ordina alfabeticamente
  const fetchGlobali = async () => {
    try {
      const docCatSnap = await getDoc(doc(db, "configurazioni", tabAttivo));
      const giochi = docCatSnap.exists() ? docCatSnap.data().giochi || [] : [];

      const docGlobSnap = await getDoc(doc(db, "configurazioni", "GLOBALE"));
      const globaleData = docGlobSnap.exists() ? docGlobSnap.data() : { piste: [], auto: [] };

      setListeGlobali({
        giochi: giochi.sort((a: string, b: string) => a.localeCompare(b)),
        piste: (globaleData.piste || []).sort((a: string, b: string) => a.localeCompare(b)),
        auto: (globaleData.auto || []).sort((a: string, b: string) => a.localeCompare(b)),
      });
    } catch (error) {
      console.error("Errore nel fetch globale:", error);
    }
  };

  useEffect(() => {
    if (!caricamento) fetchGlobali();
  }, [tabAttivo, caricamento]);

  // 3. AGGIUNGI ELEMENTO
  const aggiungiElemento = async (campo: "giochi" | "piste" | "auto", valore: string) => {
    if (!valore.trim()) return;
    try {
      const docName = campo === "piste" || campo === "auto" ? "GLOBALE" : tabAttivo;
      await setDoc(doc(db, "configurazioni", docName), { [campo]: arrayUnion(valore.trim()) }, { merge: true });

      setListeGlobali((prev) => {
        const nuovaLista = [...prev[campo], valore.trim()].sort((a, b) => a.localeCompare(b));
        return { ...prev, [campo]: nuovaLista };
      });

      if (campo === "giochi") setNuovoGioco("");
      if (campo === "piste") setNuovaPista("");
      if (campo === "auto") setNuovaAuto("");
    } catch (error) {
      console.error("Errore salvataggio:", error);
      alert("Errore durante il salvataggio.");
    }
  };

  // 4. ELIMINA ELEMENTO
  const eliminaElemento = async (campo: "giochi" | "piste" | "auto", valore: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${valore}" dal database?`)) return;
    
    try {
      const docName = campo === "piste" || campo === "auto" ? "GLOBALE" : tabAttivo;
      await setDoc(doc(db, "configurazioni", docName), { [campo]: arrayRemove(valore) }, { merge: true });

      setListeGlobali((prev) => ({
        ...prev,
        [campo]: prev[campo].filter(v => v !== valore)
      }));
    } catch (error) {
      console.error("Errore eliminazione:", error);
      alert("Errore durante l'eliminazione.");
    }
  };

  // 5. MODIFICA ELEMENTO (Correzione errori battitura)
  const modificaElemento = async (campo: "giochi" | "piste" | "auto", valoreVecchio: string) => {
    const nuovoValore = prompt(`Modifica il nome di "${valoreVecchio}":`, valoreVecchio);
    
    // Se l'utente annulla o lascia vuoto o non cambia niente, non fare nulla
    if (!nuovoValore || nuovoValore.trim() === "" || nuovoValore === valoreVecchio) return;

    try {
      const docName = campo === "piste" || campo === "auto" ? "GLOBALE" : tabAttivo;
      const docRef = doc(db, "configurazioni", docName);
      
      // Rimuove il vecchio e aggiunge il nuovo
      await setDoc(docRef, { [campo]: arrayRemove(valoreVecchio) }, { merge: true });
      await setDoc(docRef, { [campo]: arrayUnion(nuovoValore.trim()) }, { merge: true });

      setListeGlobali((prev) => {
        const listaSenzaVecchio = prev[campo].filter(v => v !== valoreVecchio);
        const nuovaLista = [...listaSenzaVecchio, nuovoValore.trim()].sort((a, b) => a.localeCompare(b));
        return { ...prev, [campo]: nuovaLista };
      });

    } catch (error) {
      console.error("Errore modifica:", error);
      alert("Errore durante la modifica.");
    }
  };


  if (caricamento) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Verifica credenziali Admin...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER ADMIN */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-2">👑 Pannello Admin</h1>
            <p className="text-slate-400 text-sm mt-1">Gestisci i database dei Simulatori e del Mondo Reale.</p>
          </div>
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm transition-colors">Torna alla Home</Link>
        </div>

        {/* TAB SELECTION */}
        <div className="flex gap-2 mb-8 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <button onClick={() => setTabAttivo("SIMRACING")} className={`flex-1 py-3 rounded-lg font-bold transition-all ${tabAttivo === "SIMRACING" ? "bg-[#6db029] text-white shadow-lg" : "text-slate-500 hover:text-white"}`}>🎮 Dati Simracing</button>
          <button onClick={() => setTabAttivo("REALTIME")} className={`flex-1 py-3 rounded-lg font-bold transition-all ${tabAttivo === "REALTIME" ? "bg-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}>🌍 Dati Real World</button>
        </div>

        {/* =========================================
            SEZIONE 1: AGGIUNTA RAPIDA
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">{tabAttivo === "SIMRACING" ? "Nuovo Simulatore" : "Nuovo Campionato"}</h3>
            <div className="flex flex-col gap-3">
              <input value={nuovoGioco} onChange={(e) => setNuovoGioco(e.target.value)} placeholder="Inserisci nome..." className="bg-slate-800 border border-slate-700 p-3 rounded focus:border-amber-500 outline-none text-sm"/>
              <button onClick={() => aggiungiElemento("giochi", nuovoGioco)} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold transition-colors">+ Aggiungi</button>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Nuova Pista</h3>
            <div className="flex flex-col gap-3">
              <input value={nuovaPista} onChange={(e) => setNuovaPista(e.target.value)} placeholder="Inserisci pista..." className="bg-slate-800 border border-slate-700 p-3 rounded focus:border-amber-500 outline-none text-sm"/>
              <button onClick={() => aggiungiElemento("piste", nuovaPista)} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold transition-colors">+ Aggiungi Pista</button>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Nuova Auto</h3>
            <div className="flex flex-col gap-3">
              <input value={nuovaAuto} onChange={(e) => setNuovaAuto(e.target.value)} placeholder="Inserisci auto..." className="bg-slate-800 border border-slate-700 p-3 rounded focus:border-amber-500 outline-none text-sm"/>
              <button onClick={() => aggiungiElemento("auto", nuovaAuto)} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-bold transition-colors">+ Aggiungi Auto</button>
            </div>
          </div>
        </div>

        {/* =========================================
            SEZIONE 2: GESTIONE DATI ESISTENTI
        ========================================= */}
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          🛠️ Gestione Dati Esistenti
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LISTA GIOCHI */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-125 overflow-y-auto">
            <h3 className="font-bold text-amber-500 mb-4 sticky top-0 bg-slate-900 py-2 border-b border-slate-800">
              {tabAttivo === "SIMRACING" ? "Simulatori Registrati" : "Campionati Registrati"}
            </h3>
            <ul className="space-y-2">
              {listeGlobali.giochi.map(gioco => (
                <li key={gioco} className="flex justify-between items-center p-2 hover:bg-slate-800 rounded group">
                  <span className="text-sm font-medium">{gioco}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => modificaElemento("giochi", gioco)} className="text-blue-400 hover:text-blue-300" title="Modifica">✏️</button>
                    <button onClick={() => eliminaElemento("giochi", gioco)} className="text-red-400 hover:text-red-300" title="Elimina">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* LISTA PISTE */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-125 overflow-y-auto">
            <h3 className="font-bold text-amber-500 mb-4 sticky top-0 bg-slate-900 py-2 border-b border-slate-800">Piste nel DB Globale</h3>
            <ul className="space-y-2">
              {listeGlobali.piste.map(pista => (
                <li key={pista} className="flex justify-between items-center p-2 hover:bg-slate-800 rounded group">
                  <span className="text-sm font-medium">{pista}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => modificaElemento("piste", pista)} className="text-blue-400 hover:text-blue-300" title="Modifica">✏️</button>
                    <button onClick={() => eliminaElemento("piste", pista)} className="text-red-400 hover:text-red-300" title="Elimina">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* LISTA AUTO */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-125 overflow-y-auto">
            <h3 className="font-bold text-amber-500 mb-4 sticky top-0 bg-slate-900 py-2 border-b border-slate-800">Auto nel DB Globale</h3>
            <ul className="space-y-2">
              {listeGlobali.auto.map(auto => (
                <li key={auto} className="flex justify-between items-center p-2 hover:bg-slate-800 rounded group">
                  <span className="text-sm font-medium">{auto}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => modificaElemento("auto", auto)} className="text-blue-400 hover:text-blue-300" title="Modifica">✏️</button>
                    <button onClick={() => eliminaElemento("auto", auto)} className="text-red-400 hover:text-red-300" title="Elimina">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </main>
  );
}