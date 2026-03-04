"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase"; 
import { LapTime } from "../../lib/types";
import Link from "next/link";
import Leaderboard from "../../components/Leaderboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myLaps, setMyLaps] = useState<LapTime[]>([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchMyLaps(currentUser.uid);
      } else {
        router.push("/auth/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchMyLaps = async (uid: string) => {
    try {
      const q = query(collection(db, "tempi"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const tempiScaricati: LapTime[] = [];
      
      querySnapshot.forEach((doc) => {
        tempiScaricati.push({ id: doc.id, ...doc.data() } as LapTime);
      });
      
      tempiScaricati.sort((a, b) => a.timeMs - b.timeMs);
      setMyLaps(tempiScaricati);
    } catch (error) {
      console.error("Errore nel caricamento dei tempi personali:", error);
    } finally {
      setCaricamento(false);
    }
  };

  const handleDeleteLap = async (lapId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo record per sempre?")) return;
    try {
      await deleteDoc(doc(db, "tempi", lapId));
      setMyLaps((prevLaps) => prevLaps.filter((lap) => lap.id !== lapId));
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      alert("Si è verificato un errore durante l'eliminazione.");
    }
  };

  // NUOVA FUNZIONE: Cambia lo stato della privacy su Firebase
  const handleTogglePrivacy = async (lapId: string, currentPrivacy: boolean) => {
    try {
      const nuovoStato = !currentPrivacy; // Se era true diventa false, e viceversa
      await updateDoc(doc(db, "tempi", lapId), {
        isPrivate: nuovoStato
      });
      
      // Aggiorna lo stato locale senza dover ricaricare dal database
      setMyLaps((prevLaps) => 
        prevLaps.map((lap) => 
          lap.id === lapId ? { ...lap, isPrivate: nuovoStato } : lap
        )
      );
    } catch (error) {
      console.error("Errore durante l'aggiornamento della privacy:", error);
      alert("Errore durante la modifica.");
    }
  };

  if (caricamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-indigo-500 font-bold text-xl">Accesso ai box... 🔧</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-indigo-500 leading-none mb-2">
              I Tuoi Tempi
            </h1>
            <p className="text-slate-400 text-sm">
              Gestisci i record personali di <b className="text-white">{user?.displayName || user?.email}</b>
            </p>
          </div>
          
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg font-bold transition-colors shadow-md">
            🔙 Torna in Pista
          </Link>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <Leaderboard 
            laps={myLaps} 
            titolo="Storico Record" 
            onDelete={handleDeleteLap} 
            onTogglePrivacy={handleTogglePrivacy} // <-- Passiamo la nuova funzione
          />
        </div>
      </div>
    </main>
  );
}