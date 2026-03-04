import Link from "next/link";
import { User, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

interface NavbarProps {
  user: User | null;
  isAdmin: boolean;
}

export default function Navbar({ user, isAdmin }: NavbarProps) {
  return (
    <nav className="mb-10 py-4 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* LOGO SEZIONE */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
              <img src="/lapTracker.png" alt="Lap Tracker Logo" className="h-14 md:h-16 w-auto object-contain" />
            </Link>
            
            {/* Pilota Info Mobile */}
            {user && (
              <div className="md:hidden flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Driver</span>
                <span className="text-sm font-bold text-white bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                  {user.displayName?.split(" ")[0] || user.email?.split("@")[0]}
                </span>
              </div>
            )}
          </div>

          {/* NAVIGAZIONE E AZIONI */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-2 w-full md:w-auto">
            
            {/* Link Principali */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
              <Link 
                href="/real-world" 
                className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-500 hover:bg-amber-500/10 transition-all text-center"
              >
                🌍 World Records
              </Link>
              
              {user && (
                <Link 
                  href="/dashboard" 
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-indigo-400 hover:bg-indigo-500/10 transition-all text-center"
                >
                  📊 My Laps
                </Link>
              )}
            </div>

            {/* Azioni Admin & Account */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center">
              {user ? (
                <>
                  <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Driver</span>
                    <span className="text-sm font-bold text-white">{user.displayName || user.email}</span>
                  </div>

                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="p-2.5 rounded-lg bg-slate-800 text-amber-500 border border-slate-700 hover:bg-slate-700 transition-all shadow-lg"
                      title="Admin Panel"
                    >
                      👑
                    </Link>
                  )}

                  <button 
                    onClick={() => signOut(auth)} 
                    className="flex-1 md:flex-none px-5 py-2.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 w-full">
                  <Link 
                    href="/auth/login" 
                    className="flex-1 px-6 py-2.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-all"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="flex-1 px-6 py-2.5 rounded-lg bg-[#6db029] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#5a9222] transition-all shadow-[0_0_15px_rgba(109,176,41,0.3)]"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}