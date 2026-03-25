import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Only allow safe alphanumeric characters in invite codes
const INVITE_CODE_REGEX = /^[A-Z0-9]{0,6}$/;

export default function JoinCouple() {
  const { code: urlCode } = useParams();
  const { createCouple, joinCouple, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(urlCode ? "join" : null);
  const [inviteCode, setInviteCode] = useState(urlCode || "");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const code = await createCouple();
      setGeneratedCode(code);
    } catch (err) {
      setError("No se pudo crear la pareja. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const clean = inviteCode.trim().toUpperCase();
    if (!clean || !INVITE_CODE_REGEX.test(clean) || clean.length < 4) {
      setError("Código inválido. Comprueba que tiene 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await joinCouple(clean);
      navigate("/");
    } catch (err) {
      setError("Código no encontrado o ya usado.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }

  function shareLink() {
    // Sanitize: only use alphanumeric code in URL
    const safeCode = generatedCode?.replace(/[^A-Z0-9]/g, "") || "";
    const url = `${window.location.origin}/join/${safeCode}`;
    if (navigator.share) {
      navigator.share({ title: "Únete a Luvio", text: "Lleva nuestros gastos juntos", url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  function handleCodeInput(e) {
    const val = e.target.value.toUpperCase();
    if (INVITE_CODE_REGEX.test(val)) {
      setInviteCode(val);
      setError(null);
    }
  }

  const firstName = user?.displayName?.split(" ")[0] || "Hola";

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-8 py-12 bg-luvio-bg safe-top safe-bottom">

      {/* Header */}
      <div className="text-center">
        <h1 className="font-display italic text-5xl text-luvio-terra font-light mb-2">
          luvio
        </h1>
        <p className="text-luvio-warm500 text-sm font-light">
          Bienvenido, {firstName}
        </p>
      </div>

      {/* Content */}
      <div className="w-full max-w-xs">

        {/* Mode selector */}
        {!mode && !generatedCode && (
          <div className="space-y-3 animate-fade-up">
            <p className="text-luvio-warm500 text-xs text-center mb-6 tracking-wide uppercase">
              ¿Cómo empezamos?
            </p>
            <button
              onClick={() => { setMode("create"); handleCreate(); }}
              className="w-full py-4 rounded-2xl bg-luvio-terra text-white
                         font-sans font-medium text-base press-scale
                         active:opacity-80 transition-opacity"
            >
              Crear pareja nueva
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full py-4 rounded-2xl bg-luvio-surface text-luvio-text
                         border border-luvio-warm200 font-sans font-medium text-base
                         press-scale active:bg-luvio-warm100 transition-colors"
            >
              Tengo un código
            </button>
          </div>
        )}

        {/* Generated code */}
        {generatedCode && (
          <div className="animate-fade-up text-center">
            <p className="text-luvio-warm500 text-xs tracking-widest uppercase mb-6">
              Comparte este código
            </p>
            <div className="bg-luvio-surface rounded-3xl p-8 border border-luvio-warm100 mb-6 shadow-surface">
              <p className="font-display text-5xl text-luvio-terra tracking-[0.25em] font-light">
                {generatedCode}
              </p>
            </div>
            <p className="text-luvio-warm500 text-xs mb-6 leading-relaxed">
              Cuando tu pareja introduzca este código,<br />
              la app se activará automáticamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={copyCode}
                className="flex-1 py-3 rounded-xl bg-luvio-surface text-luvio-warm500
                           text-sm font-medium border border-luvio-warm200 press-scale
                           transition-colors active:bg-luvio-warm100"
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
              <button
                onClick={shareLink}
                className="flex-1 py-3 rounded-xl bg-luvio-terra text-white
                           text-sm font-medium press-scale active:opacity-80 transition-opacity"
              >
                Compartir
              </button>
            </div>
          </div>
        )}

        {/* Join with code */}
        {mode === "join" && !generatedCode && (
          <div className="animate-fade-up">
            <p className="text-luvio-warm500 text-xs tracking-widest uppercase text-center mb-6">
              Introduce el código
            </p>
            <input
              value={inviteCode}
              onChange={handleCodeInput}
              placeholder="ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              className="w-full py-5 text-center font-display text-4xl font-light tracking-[0.3em]
                         rounded-2xl border-2 border-luvio-warm200 bg-luvio-surface text-luvio-terra
                         focus:border-luvio-terra focus:outline-none transition-colors mb-4"
            />
            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}
            <button
              onClick={handleJoin}
              disabled={loading || inviteCode.length < 4}
              className="w-full py-4 rounded-2xl bg-luvio-terra text-white font-sans
                         font-medium disabled:opacity-30 transition-opacity press-scale mb-4"
            >
              {loading ? "Uniéndose..." : "Unirme"}
            </button>
            <button
              onClick={() => { setMode(null); setError(null); setInviteCode(""); }}
              className="w-full text-luvio-warm500 text-sm py-2"
            >
              Volver
            </button>
          </div>
        )}

      </div>

      {/* Bottom spacer */}
      <div />
    </div>
  );
}
