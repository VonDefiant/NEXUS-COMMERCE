import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_APP_URL || "http://localhost:3000",
    basePath: "/api/auth",
    fetchOptions: {
        credentials: "include" as RequestCredentials,
        onRequest: (context) => {
            const token = localStorage.getItem("nexus_session_token");
            if (token) {
                context.headers.set("Authorization", `Bearer ${token}`);
            }
        },
        onSuccess: (context) => {
            const data = context.data as any;
            if (data?.token) {
                localStorage.setItem("nexus_session_token", data.token);
            }
            if (data?.session?.token) {
                localStorage.setItem("nexus_session_token", data.session.token);
            }
        }
    },
    plugins: [],
});

export const { useSession, signIn, signUp, signOut } = authClient;
