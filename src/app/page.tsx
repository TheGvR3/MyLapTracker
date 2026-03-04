"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc, where } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase"; 
import { LapTime } from "../lib/types";

// Importiamo i nostri nuovi componenti puliti!
import Navbar from "../components/Navbar";
import LapForm from "../components/LapForm";
import Leaderboard from "../components/Leaderboard";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [caricamento, setCaricamento] = useState(true);

  // Funzione isolata per scaricare i tempi (viene passata anche al Form per ricaricare dopo un salvataggio)
  // 3. SCARICA LA CLASSIFICA TEMPI (SOLO SIMRACING!)
  const fetchTempi = async () => {
    try {
      // Chiediamo a Firebase SOLO i tempi della categoria SIMRACING
      const q = query(collection(db, "tempi"), where("categoria", "==", "SIMRACING"));
      const querySnapshot = await getDocs(q);
      const tempiScaricati: LapTime[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isPrivate) {
          tempiScaricati.push({ id: doc.id, ...data } as LapTime);
        }
      });

      // Ordiniamo la classifica localmente dal più veloce al più lento
      tempiScaricati.sort((a, b) => a.timeMs - b.timeMs);
      
      setLaps(tempiScaricati);
    } catch (error) {
      console.error("Errore nel caricamento dei tempi:", error);
    } finally {
      setCaricamento(false);
    }
  };

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
    fetchTempi();
    return () => unsubscribeAuth();
  }, []);

  if (caricamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-[#6db029] font-bold text-xl">Scaldando i motori... 🏎️</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* L'header isolato nel suo componente */}
        <Navbar user={user} isAdmin={isAdmin} />

        {/* Il mega-form isolato. Gli passiamo fetchTempi così si aggiorna la pagina quando salvi */}
        <LapForm user={user} isAdmin={isAdmin} onTempoSalvato={fetchTempi} />

        {/* La classifica isolata */}
        <Leaderboard laps={laps} />

      </div>
    </main>
  );
}