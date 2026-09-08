import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./client";
import { createOrUpdateUser } from "./user"; // createOrUpdateUser dosyanın konumu

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    
    await createOrUpdateUser(result.user);

    console.log("Kullanıcı ve Firestore kaydı başarılı:", result.user);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

export async function logout() {
  return await signOut(auth);
}