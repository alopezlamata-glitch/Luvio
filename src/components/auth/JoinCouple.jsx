import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function JoinCouple() {
  const { code: urlCode } = useParams();
  const { createCouple, joinCouple, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(urlCode ? "join" : null); // null, 'create', 'join'
  const [inviteCode, setInviteCode] = useState(urlCode || "");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const code = await createCouple();
      setGeneratedCode(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await joinCouple(inviteCode.trim());
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(generatedCode);
  }

  function shareLink() {
    const url = `${window.location.origin}/join/${generatedCode}`;
    if (navigator.share) {
      navigator.share({ title: "Únete a Luvio", text: "¡Lleva nuestras cuentas juntos!", url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-coral-400 to-amber-400 bg-clip-text text-transparent mb-2">
        luvio
      </h1>
      <p className="text-zinc-500 text-sm mb-10">
        Hola, {user?.displayName?.split(" ")[0]} 👋
      </p>

      {/* Elegir modo */}
      {!mode && !generatedCode && (
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={() => { setMode("create"); handleCreate(); }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-coral-400 to-amber-400 text-white font-semibold text-base"
          >
            Crear pareja nueva 💕
          </button>
          <button
            onClick={() => setMode("join")}
            className="w-full py-4 rounded-2xl border-2 border-white/10 text-zinc-300 font-medium text-base hover:border-white/20 transition-colors"
          >
            Tengo un código
          </button>
        </div>
      )}

      {/* Código generado */}
      {generatedCode && (
        <div className="w-full max-w-xs animate-fade-up">
          <p className="text-zinc-400 text-sm mb-4">Comparte este código con tu pareja:</p>
          <div className="bg-luvio-card rounded-2xl p-6 border border-white/5 mb-6">
            <p className="text-4xl font-bold text-white tracking-[0.3em] font-mono">
              {generatedCode}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={copyCode} className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-300 text-sm font-medium">
              Copiar código
            </button>
            <button onClick={shareLink} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-coral-400 to-amber-400 text-white text-sm font-semibold">
              Compartir link
            </button>
          </div>
          <p className="text-zinc-600 text-xs mt-6">
            Cuando tu pareja se una, la app se activará automáticamente ✨
          </p>
        </div>
      )}

      {/* Introducir código */}
      {mode === "join" && !generatedCode && (
        <div className="w-full max-w-xs animate-fade-up">
          <p className="text-zinc-400 text-sm mb-4">Introduce el código de tu pareja:</p>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full py-4 text-center text-2xl font-bold tracking-[0.3em] rounded-2xl
                       border-2 border-white/10 bg-white/[0.03] text-white
                       focus:border-coral-400 focus:outline-none transition-colors font-mono mb-4"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={loading || !inviteCode.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-coral-400 to-amber-400
                       text-white font-semibold disabled:opacity-30 transition-opacity"
          >
            {loading ? "Uniéndose..." : "Unirme"}
          </button>
          <button onClick={() => setMode(null)} className="text-zinc-600 text-sm mt-4">
            ← Volver
          </button>
        </div>
      )}
    </div>
  );
}
