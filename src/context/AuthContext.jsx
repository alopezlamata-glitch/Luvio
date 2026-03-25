import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  OAuthProvider,
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, googleProvider, db } from "../config/firebase";
import { isNative, isIOS } from "../utils/native";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [coupleId, setCoupleId] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios de autenticación
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          await loadCoupleData(firebaseUser.uid);
        } else {
          setCoupleId(null);
          setPartner(null);
        }
        setLoading(false);
      }, () => setLoading(false));
    } catch {
      setLoading(false);
    }
    return unsub;
  }, []);

  // Cargar datos de la pareja
  async function loadCoupleData(uid) {
    const coupleRef = ref(db, `userCouples/${uid}`);
    const snap = await get(coupleRef);
    if (snap.exists()) {
      const cId = snap.val().coupleId;
      setCoupleId(cId);

      // Cargar datos del partner
      const membersRef = ref(db, `couples/${cId}/members`);
      const membersSnap = await get(membersRef);
      if (membersSnap.exists()) {
        const members = membersSnap.val();
        const partnerUid = Object.keys(members).find((k) => k !== uid);
        if (partnerUid) setPartner(members[partnerUid]);
      }
    }
  }

  // ─── Login con Google ───
  async function loginWithGoogle() {
    if (isNative) {
      // En Capacitor nativo, usar @codetrix-studio/capacitor-google-auth
      // o firebase-authentication-capacitor plugin
      const { FirebaseAuthentication } = await import(
        "@capacitor-firebase/authentication"
      );
      const result = await FirebaseAuthentication.signInWithGoogle();
      const credential = GoogleAuthProvider.credential(result.credential?.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    }

    // Web: popup
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }

  // ─── Sign in with Apple (obligatorio para App Store) ───
  async function loginWithApple() {
    if (isNative && isIOS) {
      // Capacitor nativo: usa el Sign in with Apple nativo de iOS
      try {
        const { FirebaseAuthentication } = await import(
          "@capacitor-firebase/authentication"
        );
        const result = await FirebaseAuthentication.signInWithApple();

        // Crear credential de Firebase con el token de Apple
        const provider = new OAuthProvider("apple.com");
        const credential = provider.credential({
          idToken: result.credential?.idToken,
          rawNonce: result.credential?.nonce,
        });

        const userCredential = await signInWithCredential(auth, credential);

        // Apple puede no dar displayName después del primer login
        // Guardar el nombre si viene
        if (result.user?.displayName && !userCredential.user.displayName) {
          await userCredential.user.updateProfile({
            displayName: result.user.displayName,
          });
        }

        return userCredential.user;
      } catch (error) {
        if (error.code === "ERR_CANCELED") return null; // User canceló
        console.error("Apple Sign In error:", error);
        throw error;
      }
    }

    // Web fallback: popup con OAuthProvider
    try {
      const appleProvider = new OAuthProvider("apple.com");
      appleProvider.addScope("email");
      appleProvider.addScope("name");
      const result = await signInWithPopup(auth, appleProvider);
      return result.user;
    } catch (error) {
      console.error("Apple Sign In error:", error);
      throw error;
    }
  }

  // Crear pareja y generar código de invitación
  async function createCouple() {
    if (!user) throw new Error("Debes iniciar sesión primero");

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCoupleId = `couple_${Date.now()}`;

    await set(ref(db, `couples/${newCoupleId}`), {
      members: {
        [user.uid]: {
          name: user.displayName || "Usuario",
          photo: user.photoURL || null,
          email: user.email,
        },
      },
      createdAt: Date.now(),
      subscription: { plan: "free", expenseCount: 0, limit: 20 },
    });

    await set(ref(db, `userCouples/${user.uid}`), { coupleId: newCoupleId });

    await set(ref(db, `invites/${inviteCode}`), {
      coupleId: newCoupleId,
      createdBy: user.uid,
      createdAt: Date.now(),
    });

    setCoupleId(newCoupleId);
    return inviteCode;
  }

  // Unirse a pareja existente con código
  async function joinCouple(inviteCode) {
    if (!user) throw new Error("Debes iniciar sesión primero");

    const inviteRef = ref(db, `invites/${inviteCode.toUpperCase()}`);
    const snap = await get(inviteRef);

    if (!snap.exists()) throw new Error("Código inválido");

    const { coupleId: cId } = snap.val();

    const membersSnap = await get(ref(db, `couples/${cId}/members`));
    if (membersSnap.exists() && Object.keys(membersSnap.val()).length >= 2) {
      throw new Error("Esta pareja ya está completa");
    }

    await set(ref(db, `couples/${cId}/members/${user.uid}`), {
      name: user.displayName || "Usuario",
      photo: user.photoURL || null,
      email: user.email,
    });

    await set(ref(db, `userCouples/${user.uid}`), { coupleId: cId });

    setCoupleId(cId);
    await loadCoupleData(user.uid);
  }

  async function logout() {
    // Limpiar sesión nativa también
    if (isNative) {
      try {
        const { FirebaseAuthentication } = await import(
          "@capacitor-firebase/authentication"
        );
        await FirebaseAuthentication.signOut();
      } catch {}
    }
    await signOut(auth);
    setUser(null);
    setCoupleId(null);
    setPartner(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        coupleId,
        partner,
        loading,
        loginWithGoogle,
        loginWithApple,
        createCouple,
        joinCouple,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
