import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Settings from "../settings/Settings";

function sanitizeInviteCode(val) {
  return val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

// Only allow safe alphanumeric characters in invite codes
const INVITE_CODE_REGEX = /^[A-Z0-9]{0,6}$/;
// Sanitize text input
function sanitizeText(str) {
  return str.replace(/[<>"'&]/g, "").slice(0, 30);
}

export default function JoinCouple() {
  const { code: urlCode } = useParams();
  const { createCouple, joinCouple, user } = useAuth();
  const navigate = useNavigate();

  const defaultName = user?.displayName?.split(" ")[0] || "";
  const [nickname, setNickname] = useState(defaultName);
  const [nicknameSet, setNicknameSet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState(urlCode ? "join" : null);
  const [inviteCode, setInviteCode] = useState(urlCode || "");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleNicknameSubmit() {
    const clean = sanitizeText(nickname.trim());
    if (!clean) return;
    setNickname(clean);
    setNicknameSet(true);
  }

  async function handleCreate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await createCouple(nickname);
      navigate("/");
    } catch (err) {
      console.error("createCouple error:", err?.message || err?.code, err);
      setError("No se pudo crear: " + (err?.message || "inténtalo de nuevo"));
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
      await joinCouple(clean, nickname);
      navigate("/");
    } catch (err) {
      setError("Código no encontrado o ya usado.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeInput(e) {
    const val = sanitizeInviteCode(e.target.value);
    if (INVITE_CODE_REGEX.test(val)) {
      setInviteCode(val);
      setError(null);
    }
  }

  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-8 py-12 bg-luvio-bg safe-top safe-bottom">

      {/* Header */}
      <div className="w-full flex items-start justify-between">
        <div className="text-center flex-1">
          <img src="/logo.jpg" alt="luvio" className="h-14 w-auto mb-2 mx-auto mix-blend-multiply brightness-110" />
          <p className="text-luvio-warm500 text-sm font-light">
            {nicknameSet ? `Hola, ${nickname}` : "¿Cómo te llamas?"}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Ajustes"
          className="w-9 h-9 rounded-xl bg-luvio-warm100 flex items-center justify-center text-luvio-warm500 press-scale mt-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="w-full max-w-xs">

        {/* Nickname step */}
        {!nicknameSet && (
          <div className="animate-fade-up space-y-4">
            <input
              value={nickname}
              onChange={(e) => setNickname(sanitizeText(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && handleNicknameSubmit()}
              placeholder="Tu mote o nombre"
              maxLength={30}
              autoFocus
              autoComplete="off"
              className="w-full py-4 px-5 text-center font-sans text-xl rounded-2xl
                         border-2 border-luvio-warm200 bg-luvio-surface text-luvio-text
                         focus:border-luvio-terra focus:outline-none transition-colors"
            />
            <button
              onClick={handleNicknameSubmit}
              disabled={!nickname.trim()}
              className="w-full py-4 rounded-2xl bg-luvio-terra text-white
                         font-sans font-medium text-base press-scale
                         disabled:opacity-30 transition-opacity"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Mode selector */}
        {nicknameSet && !mode && (
          <div className="space-y-3 animate-fade-up">
            <p className="text-luvio-warm500 text-xs text-center mb-6 tracking-wide uppercase">
              ¿Cómo empezamos?
            </p>
            {error && (
              <p className="text-red-400 text-xs text-center mb-2 font-sans">{error}</p>
            )}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-luvio-terra text-white
                         font-sans font-medium text-base press-scale
                         disabled:opacity-50 active:opacity-80 transition-opacity"
            >
              {loading ? "Creando vínculo..." : "Empezar juntos"}
            </button>
            <button
              onClick={() => setMode("join")}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-luvio-surface text-luvio-text
                         border border-luvio-warm200 font-sans font-medium text-base
                         press-scale active:bg-luvio-warm100 transition-colors disabled:opacity-50"
            >
              Tengo un código
            </button>
          </div>
        )}

        {/* Join with code */}
        {mode === "join" && (
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
