"use client";

import { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { auth, db } from "../../../lib/firebase"; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  // === REGISTRAZIONE CLASSICA CON EMAIL E PASSWORD ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Le password non combaciano.");
      return;
    }

    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }

    setCaricamento(true);

    try {
      // 1. Firebase Auth crea l'utente
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Creiamo il "Passaporto" nel DB
      await setDoc(doc(db, "utenti", user.uid), {
        email: user.email,
        ruolo: "user",
        creato_il: new Date().toISOString()
      });

      router.push("/"); 

    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("Questa email è già registrata.");
      } else {
        setError("Errore durante la registrazione. Riprova.");
      }
      setCaricamento(false);
    }
  };

  // === LA MAGIA: ACCESSO / REGISTRAZIONE CON GOOGLE ===
  const handleGoogleSignIn = async () => {
    setError("");
    setCaricamento(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Controlliamo se questo utente esiste già nel nostro database Firestore
      const docRef = doc(db, "utenti", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Estraiamo nome e cognome dal displayName di Google
        const nomeCompleto = user.displayName || "";
        const nome = nomeCompleto.split(" ")[0] || "";
        const cognome = nomeCompleto.split(" ").slice(1).join(" ") || "";

        await setDoc(docRef, {
          email: user.email,
          nome: nome,
          cognome: cognome,
          ruolo: "user",
          creato_il: new Date().toISOString()
        });
      }

      router.push("/d");
    } catch (error: any) {
      console.error(error);
      setError("Errore durante l'accesso con Google. Riprova.");
      setCaricamento(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🧳</span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Unisciti a LapTracker
          </h1>
          <p className="text-gray-500 font-medium">
            Crea il tuo passaporto digitale gratuito.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm text-center">
            {error}
          </div>
        )}

        {/* === BOTTONE GOOGLE === */}
        <button
          onClick={handleGoogleSignIn}
          disabled={caricamento}
          type="button"
          className="w-full bg-white border-2 border-gray-200 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Registrati con Google
        </button>

        <div className="flex items-center gap-4 mb-6 opacity-60">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Oppure via Email</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* === FORM EMAIL CLASSICO === */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-800"
              placeholder="es. mario@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-800"
              placeholder="Minimo 6 caratteri"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Conferma Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-800"
              placeholder="Ripeti la password"
            />
          </div>

          <button
            type="submit"
            disabled={caricamento}
            className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-md transition-transform active:scale-[0.98] disabled:opacity-70 mt-2"
          >
            {caricamento ? "Creazione in corso..." : "Crea Account"}
          </button>

          <div className="text-center mt-6 text-sm font-medium text-gray-500">
            Hai già un account?{" "}
            <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">
              Accedi qui
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}