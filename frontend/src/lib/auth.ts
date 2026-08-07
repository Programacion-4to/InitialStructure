import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "./api";

export type UserRole = "pasajero" | "conductor" | "admin";

export type AuthSession = {
  access_token: string;
  role: UserRole;
  user_id: number;
  pasajero_id: number | null;
  conductor_id: number | null;
};

type State = {
  session: AuthSession | null;
  loginUser: (email: string, password: string) => Promise<AuthSession>;
  loginAdmin: (email: string, password: string) => Promise<AuthSession>;
  registerPasajero: (data: {
    email: string;
    password: string;
    nombre: string;
    telefono: string;
  }) => Promise<AuthSession>;
  registerConductor: (data: {
    email: string;
    password: string;
    nombre: string;
    licencia: string;
  }) => Promise<AuthSession>;
  logout: () => void;
};

export const useAuth = create<State>()(
  persist(
    (set, get) => ({
      session: null,
      async loginUser(email, password) {
        const session = await apiFetch<AuthSession>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (session.role === "admin") {
          throw new Error("Esta cuenta es de administrador. Usá la solapa Admin.");
        }
        set({ session });
        return session;
      },
      async loginAdmin(email, password) {
        const session = await apiFetch<AuthSession>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (session.role !== "admin") {
          throw new Error("La cuenta no tiene rol admin.");
        }
        set({ session });
        return session;
      },
      async registerPasajero(data) {
        const session = await apiFetch<AuthSession>("/auth/register/pasajero", {
          method: "POST",
          body: JSON.stringify(data),
        });
        set({ session });
        return session;
      },
      async registerConductor(data) {
        const session = await apiFetch<AuthSession>("/auth/register/conductor", {
          method: "POST",
          body: JSON.stringify(data),
        });
        set({ session });
        return session;
      },
      logout() {
        set({ session: null });
      },
    }),
    { name: "uber-auth" },
  ),
);

export const getToken = () => useAuth.getState().session?.access_token ?? null;
