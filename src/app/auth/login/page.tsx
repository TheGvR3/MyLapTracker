"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  // === ACCESSO CLASSICO CON EMAIL E PASSWORD ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setCaricamento(false);
      console.log("Dettaglio Errore Firebase:", err.code, err.message);

      // Caso 1: Credenziali errate o account che richiede un altro metodo (Google)
      // Firebase spesso usa 'auth/invalid-credential' per entrambi i casi per sicurezza
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password"
      ) {
        setErrore(
          "Email o password non corretti. Se hai usato Google in precedenza, accedi con quello!",
        );
      }
      // Caso 2: L'utente non esiste proprio
      else if (err.code === "auth/user-not-found") {
        setErrore("Nessun utente trovato con questa email.");
      }
      // Caso 3: L'utente è bloccato per troppi tentativi
      else if (err.code === "auth/too-many-requests") {
        setErrore(
          "Troppi tentativi falliti. Riprova più tardi o resetta la password.",
        );
      }
      // Caso generico
      else {
        setErrore(
          "Errore durante il login. Controlla la connessione o riprova.",
        );
      }
    }
  };

  // === LA MAGIA: ACCESSO / REGISTRAZIONE CON GOOGLE ===
  const handleGoogleSignIn = async () => {
    setErrore("");
    setCaricamento(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Controlliamo se questo utente esiste già nel nostro database Firestore
      const docRef = doc(db, "utenti", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // È la PRIMA VOLTA che accede con Google: Creiamo il suo "Passaporto"!
        const nomeCompleto = user.displayName || "";
        const nome = nomeCompleto.split(" ")[0] || "";
        const cognome = nomeCompleto.split(" ").slice(1).join(" ") || "";

        await setDoc(docRef, {
          email: user.email,
          nome: nome,
          cognome: cognome,
          ruolo: "user",
          creato_il: new Date().toISOString(),
        });
      }

      // Che sia nuovo o vecchio, lo mandiamo alla dashboard!
      router.push("/");
    } catch (error: any) {
      console.error(error);
      setErrore("Errore durante l'accesso con Google. Riprova.");
      setCaricamento(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🌍</span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Bentornato!
          </h1>
          <p className="text-gray-500 font-medium">
            Accedi a Laptraker per usare tutte le funzioni.
          </p>
        </div>

        {errore && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm text-center">
            {errore}
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
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continua con Google
        </button>

        <div className="flex items-center gap-4 mb-6 opacity-60">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
            Oppure via Email
          </span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* === FORM EMAIL CLASSICO === */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-800"
              placeholder="es. mario@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-gray-800"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={caricamento}
            className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-md transition-transform active:scale-[0.98] disabled:opacity-70 mt-2"
          >
            {caricamento ? "Accesso in corso..." : "Accedi"}
          </button>

          <div className="text-center mt-6 text-sm font-medium text-gray-500">
            Non hai ancora un account?{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 font-bold hover:underline"
            >
              Registrati gratis
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
