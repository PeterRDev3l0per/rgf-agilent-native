import { createContext, useContext, useState, ReactNode } from "react";

export interface NativeUser {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

interface AuthContextType {
  user: NativeUser | null;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const DEFAULT_USER: NativeUser = {
  id: "native-admin-id",
  email: "admin@agilent.native",
  user_metadata: { full_name: "Agilent Native User" },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<NativeUser | null>(DEFAULT_USER);
  const [loading] = useState(false);

  const signUp = async () => {
    return { error: null };
  };

  const signIn = async () => {
    setUser(DEFAULT_USER);
    return { error: null };
  };

  const signInWithGoogle = async () => {
    setUser(DEFAULT_USER);
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session: null, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
