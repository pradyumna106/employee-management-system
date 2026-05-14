"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { Employee } from "./types";

interface AuthContextType {
  user: any | null;
  employee: Employee | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndEmployee = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select(`*, employees (*)`)
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.error("❌ Database Error:", error.message);
          return;
        }

        if (profile) {
          setUser({
            id: profile.id,
            role: profile.role,
            employeeId: profile.employee_id,
          });
          
          // FIXED: Map the snake_case database object to camelCase for the frontend
          if (profile.employees) {
            const dbEmp = profile.employees as any;
            setEmployee({
              id: dbEmp.id,
              firstName: dbEmp.first_name,
              lastName: dbEmp.last_name,
              email: dbEmp.email,
              phone: dbEmp.phone,
              department: dbEmp.department,
              position: dbEmp.position,
              salary: dbEmp.salary,
              dateOfJoining: dbEmp.date_of_joining,
              status: dbEmp.status,
              avatar: dbEmp.avatar,
            });
          } else {
            setEmployee(null);
          }
        } else {
          setUser(null);
          setEmployee(null);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfileAndEmployee(session.user.id);
      }
      setIsLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await fetchProfileAndEmployee(session.user.id);
        } else {
          setUser(null);
          setEmployee(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login Error: " + error.message);
      return false;
    }

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ user, employee, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}