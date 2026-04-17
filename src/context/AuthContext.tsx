"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "admin" | "manager" | "secretary" | "employee";
export type Status = "pending" | "confirmed";

export interface UserData {
  uid: string;
  email: string;
  role: Role;
  status: Status;
  employeeId: string;
  name?: string;
  substitute_id?: string;
  substitute_valid_until?: string;
  substitute_valid_from?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        setUserData(null);
      }
    } catch (err) {
      console.error("Error fetching user data", err);
    }
  };

  useEffect(() => {
    // Bypass if Firebase is not properly configured using actual credentials
    if (!auth || !auth.app.options.apiKey || auth.app.options.apiKey === "dummy") {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      signOut, 
      refreshUserData: async () => { if (user) await fetchUserData(user.uid); } 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
