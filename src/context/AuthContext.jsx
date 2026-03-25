import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  OAuthProvider,
} from "firebase/auth";
import { ref, get, set, update } from "firebase/database";
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
  const [nickname, setNickname] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [partnerViewPhoto, setPartnerViewPhoto] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios de autenticación
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          try {
            await loadCoupleData(firebaseUser.uid);
          } catch (e) {
            console.error("loadCoupleData error:", e);
          }
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
      const cId = typeof snap.val() === "string" ? snap.val() : snap.val().coupleId;
      setCoupleId(cId);

      // Cargar invite code si no hay pareja todavía
      const inviteSnap = await get(ref(db, `couples/${cId}/inviteCode`));
      if (inviteSnap.exists()) setInviteCode(inviteSnap.val());

      // Cargar datos de todos los miembros
      const membersRef = ref(db, `couples/${cId}/members`);
      const membersSnap = await get(membersRef);
      if (membersSnap.exists()) {
        const members = membersSnap.val();
        const partnerUid = Object.keys(members).find((k) => k !== uid);
        if (partnerUid) {
          setPartner({ ...members[partnerUid], uid: partnerUid });
          setInviteCode(null); // ya hay pareja, ocultar código
        }
        // Cargar el nickname y foto propios desde Firebase
        if (members[uid]?.name)         setNickname(members[uid].name);
        if (members[uid]?.photo)        setUserPhoto(members[uid].photo);
        if (members[uid]?.partnerPhoto) setPartnerViewPhoto(members[uid].partnerPhoto);
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

  function withTimeout(promise, ms = 8000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
    ]);
  }

  // Crear pareja y generar código de invitación
  async function createCouple(nickname) {
    if (!user) throw new Error("Debes iniciar sesión primero");
    if (coupleId) throw new Error("Ya tienes una pareja vinculada");
    // Comprobación directa en Firebase (no solo estado React)
    const existingSnap = await get(ref(db, `userCouples/${user.uid}`));
    if (existingSnap.exists()) throw new Error("Ya tienes una pareja vinculada");

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCoupleId = `couple_${Date.now()}`;

    console.log("[createCouple] step 1: writing couple...");
    await withTimeout(set(ref(db, `couples/${newCoupleId}`), {
      members: {
        [user.uid]: {
          name: nickname || user.displayName || "Usuario",
          photo: user.photoURL || null,
          email: user.email,
        },
      },
      inviteCode,
      createdAt: Date.now(),
    }));

    console.log("[createCouple] step 2: writing subscription...");
    await withTimeout(set(ref(db, `couples/${newCoupleId}/subscription`), { plan: "free", expenseCount: 0, limit: 20 }));

    console.log("[createCouple] step 3: writing userCouples...");
    await withTimeout(set(ref(db, `userCouples/${user.uid}`), newCoupleId));

    console.log("[createCouple] step 4: writing invite...");
    await withTimeout(set(ref(db, `invites/${inviteCode}`), {
      coupleId: newCoupleId,
      createdBy: user.uid,
      createdAt: Date.now(),
    }));
    console.log("[createCouple] all steps done!");

    setInviteCode(inviteCode);
    setCoupleId(newCoupleId);
    return inviteCode;
  }

  // Unirse a pareja existente con código
  async function joinCouple(inviteCode, nickname) {
    if (!user) throw new Error("Debes iniciar sesión primero");
    if (coupleId) throw new Error("Ya tienes una pareja vinculada");
    // Comprobación directa en Firebase (no solo estado React)
    const existingSnap = await get(ref(db, `userCouples/${user.uid}`));
    if (existingSnap.exists()) throw new Error("Ya tienes una pareja vinculada");

    const inviteRef = ref(db, `invites/${inviteCode.toUpperCase()}`);
    const snap = await get(inviteRef);

    if (!snap.exists()) throw new Error("Código inválido");

    const { coupleId: cId } = snap.val();

    await set(ref(db, `couples/${cId}/members/${user.uid}`), {
      name: nickname || user.displayName || "Usuario",
      photo: user.photoURL || null,
      email: user.email,
    });

    await set(ref(db, `userCouples/${user.uid}`), cId);

    setCoupleId(cId);
    await loadCoupleData(user.uid);
  }

  // Cambiar foto de perfil propia
  async function updatePhoto(file) {
    if (!user || !coupleId) throw new Error("No hay sesión activa");
    const dataUrl = await resizeImage(file, 200);
    await update(ref(db, `couples/${coupleId}/members/${user.uid}`), { photo: dataUrl });
    setUserPhoto(dataUrl);
  }

  // Cambiar foto de cómo ves a tu pareja (solo tú la ves, guardada en tu nodo)
  async function updatePartnerPhoto(file) {
    if (!user || !coupleId) throw new Error("No hay sesión activa");
    const dataUrl = await resizeImage(file, 200);
    await update(ref(db, `couples/${coupleId}/members/${user.uid}`), { partnerPhoto: dataUrl });
    setPartnerViewPhoto(dataUrl);
  }

  // Cambiar mote/nombre propio
  async function updateNickname(newName) {
    if (!user || !coupleId) throw new Error("No hay sesión activa");
    await update(ref(db, `couples/${coupleId}/members/${user.uid}`), { name: newName });
    setNickname(newName);
  }

  // Desvincular pareja — el usuario sale del couple pero mantiene su cuenta
  async function leaveCouple() {
    if (!user || !coupleId) return;
    try {
      const { remove } = await import("firebase/database");
      await remove(ref(db, `couples/${coupleId}/members/${user.uid}`));
      await remove(ref(db, `userCouples/${user.uid}`));
    } catch (e) {
      console.error("leaveCouple error:", e);
    }
    setCoupleId(null);
    setPartner(null);
    setNickname(null);
    setInviteCode(null);
  }

  // Reset userPhoto en logout
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
    setNickname(null);
    setUserPhoto(null);
    setPartnerViewPhoto(null);
    setInviteCode(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        coupleId,
        partner,
        nickname,
        inviteCode,
        loading,
        loginWithGoogle,
        loginWithApple,
        createCouple,
        joinCouple,
        userPhoto,
        partnerViewPhoto,
        updateNickname,
        updatePhoto,
        updatePartnerPhoto,
        leaveCouple,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Helper: redimensiona imagen a maxSize×maxSize, devuelve data URL JPEG ───
function resizeImage(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale  = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
