"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase"; 
import { LapTime } from "../../lib/types";

import Navbar from "../../components/Navbar";
import Leaderboard from "../../components/Leaderboard";

export default function RealWorldPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [realLaps, setRealLaps] = useState<LapTime[]>([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "utenti", currentUser.uid));
        setIsAdmin(userDoc.exists() && userDoc.data().ruolo === "admin");
      } else {
        setIsAdmin(false);
      }
    });

    const fetchRealTempi = async () => {
      try {
        // Chiediamo SOLO i tempi reali inseriti dall'Admin
        const q = query(collection(db, "tempi"), where("categoria", "==", "REALTIME"));
        const querySnapshot = await getDocs(q);
        const tempiScaricati: LapTime[] = [];
        
        querySnapshot.forEach((doc) => {
          tempiScaricati.push({ id: doc.id, ...doc.data() } as LapTime);
        });

        // Ordiniamo dal più veloce al più lento
        tempiScaricati.sort((a, b) => a.timeMs - b.timeMs);
        setRealLaps(tempiScaricati);
      } catch (error) {
        console.error("Errore nel caricamento dei record mondiali:", error);
      } finally {
        setCaricamento(false);
      }
    };

    fetchRealTempi();
    return () => unsubscribeAuth();
  }, []);

  if (caricamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-amber-500 font-bold text-xl">Ricerca record mondiali... 🌍</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <Navbar user={user} isAdmin={isAdmin} />

        {/* Intestazione speciale per la pagina Real World */}
        <div className="bg-amber-900/20 border border-amber-500/30 p-6 rounded-2xl mb-8 text-center md:text-left flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl">🌍</div>
          <div>
            <h2 className="text-2xl font-bold text-amber-500 mb-2">Record del Mondo Reale</h2>
            <p className="text-slate-400 text-sm">
              Consulta i tempi ufficiali dei campionati reali. Usa i filtri in basso per trovare il tempo di riferimento della tua auto preferita e prova a batterlo sul simulatore!
            </p>
          </div>
        </div>

        {/* Riutilizziamo la Leaderboard magica! */}
        <Leaderboard laps={realLaps} titolo="Archivio Tempi Ufficiali" />

      </div>
    </main>
  );
}