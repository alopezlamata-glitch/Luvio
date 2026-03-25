import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hapticMedium } from "../../utils/native";

export default function Login() {
  const { loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // 'google' | 'apple' | null

  async function handleGoogle() {
    setLoading("google");
    try {
      await hapticMedium();
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  async function handleApple() {
    setLoading("apple");
    try {
      await hapticMedium();
      const user = await loginWithApple();
      if (user) navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between px-8 safe-top safe-bottom bg-luvio-bg">

      {/* Top spacer — generous negative space */}
      <div className="flex-1 flex flex-col items-center justify-center">

        {/* Wordmark */}
        <h1 className="font-display italic text-6xl text-luvio-terra font-light tracking-tight mb-4">
          luvio
        </h1>

        {/* Tagline */}
        <p className="text-luvio-warm500 text-base text-center leading-relaxed max-w-[220px] font-light">
          Gastos compartidos para dos.
          <br />
          Sin dramas, con amor.
        </p>
      </div>

      {/* Buttons — bottom third */}
      <div className="pb-2">
        <div className="w-full space-y-3 mb-8">
          {/* Apple — primary */}
          <button
            onClick={handleApple}
            disabled={loading !== null}
            className="w-full py-4 rounded-2xl bg-luvio-text text-luvio-bg
                       font-sans font-medium text-base flex items-center justify-center gap-3
                       active:opacity-80 transition-opacity press-scale
                       disabled:opacity-50"
          >
            {loading === "apple" ? (
              <span className="text-luvio-warm500">Conectando...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continuar con Apple
              </>
            )}
          </button>

          {/* Google — secondary */}
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full py-4 rounded-2xl bg-luvio-surface text-luvio-text
                       font-sans font-medium text-base flex items-center justify-center gap-3
                       border border-luvio-warm200
                       active:bg-luvio-warm100 transition-colors press-scale
                       disabled:opacity-50"
          >
            {loading === "google" ? (
              <span className="text-luvio-warm500">Conectando...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </>
            )}
          </button>
        </div>

        {/* Legal */}
        <p className="text-luvio-warm500 text-[10px] text-center leading-relaxed max-w-[260px] mx-auto">
          Al continuar, aceptas nuestros{" "}
          <a href="/terms" className="underline text-luvio-terra">Términos</a> y{" "}
          <a href="/privacy" className="underline text-luvio-terra">Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
}
