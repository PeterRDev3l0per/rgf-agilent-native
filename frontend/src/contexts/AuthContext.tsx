import { createContext, useContext, useState, ReactNode } from "react";

export interface NativeUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: NativeUser;
  loading: boolean;
}

const DEFAULT_USER: NativeUser = {
  id: "native-admin-id",
  email: "admin@agilent.native",
  full_name: "Agilent Native User",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<NativeUser>(DEFAULT_USER);
  const [loading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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

