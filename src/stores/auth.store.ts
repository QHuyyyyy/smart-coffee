import { create } from "zustand"
import { persist } from "zustand/middleware"
import { authService } from "@/apis/auth.service"

type LoginPayload = {
    email: string
    password: string
}

type AuthState = {
    token: string | null
    refreshToken: string | null
    isLoading: boolean
    error: string | null

    login: (payload: LoginPayload) => Promise<void>
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            isLoading: false,
            error: null,

            login: async (payload) => {
                try {
                    set({ isLoading: true, error: null })

                    const data = await authService.login(payload)

                    set({
                        token: data.accessToken,
                        refreshToken: data.refreshToken,
                        isLoading: false,
                    })
                } catch (err: any) {
                    set({
                        isLoading: false,
                        error: err.message || "Login  failed. Please try again.",
                    })
                }
            },

            logout: () => {
                set({ token: null, refreshToken: null, error: null })
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
            }),
        }
    )
)
