import { create } from "zustand"
import { persist } from "zustand/middleware"
import { authService } from "@/apis/auth.service"

type LoginPayload = {
    email: string
    password: string
}

type RegisterPayload = {
    email: string
    password: string
    phone: string
}

type VerifyOtpPayload = {
    email: string
    otp: string
    role: string
}

type UserProfile = {
    accountId: number
    email: string
    role: string
    phone?: string | null
    status?: string | null
    coffeeShopId?: number | null
    shopName?: string | null
    image?: string | null
}

type AuthState = {
    token: string | null
    refreshToken: string | null
    currentUser: UserProfile | null
    isLoading: boolean
    error: string | null
    isRefreshing: boolean

    login: (payload: LoginPayload) => Promise<void>
    register: (payload: RegisterPayload) => Promise<void>
    verifyOtp: (payload: VerifyOtpPayload) => Promise<void>
    refreshAccessToken: () => Promise<void>
    fetchCurrentUser: () => Promise<UserProfile | null>
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            currentUser: null,
            isLoading: false,
            error: null,
            isRefreshing: false,

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
                    throw err
                }
            },

            register: async (payload) => {
                try {
                    set({ isLoading: true, error: null })

                    await authService.register(payload)

                    set({
                        isLoading: false,
                    })
                } catch (err: any) {
                    set({
                        isLoading: false,
                        error: err.message || "Registration failed. Please try again.",
                    })
                    throw err
                }
            },

            verifyOtp: async (payload) => {
                try {
                    set({ isLoading: true, error: null })

                    const data = await authService.verifyOtp(payload)

                    set({
                        token: data.accessToken,
                        refreshToken: data.refreshToken,
                        isLoading: false,
                    })
                } catch (err: any) {
                    set({
                        isLoading: false,
                        error: err.message || "OTP verification failed. Please try again.",
                    })
                    throw err
                }
            },

            refreshAccessToken: async () => {
                const state = useAuthStore.getState()
                if (!state.token) {
                    set({ error: "No token to refresh" })
                    return
                }

                try {
                    set({ isRefreshing: true, error: null })

                    const data = await authService.refreshAccessToken(state.token)

                    set({
                        token: data.accessToken,
                        refreshToken: data.refreshToken,
                        isRefreshing: false,
                    })
                } catch (err: any) {
                    set({
                        isRefreshing: false,
                        error: err.message || "Token refresh failed. Please login again.",
                        token: null,
                        refreshToken: null,
                    })
                    throw err
                }
            },

            logout: () => {
                set({ token: null, refreshToken: null, currentUser: null, error: null })
            },

            fetchCurrentUser: async () => {
                const state = useAuthStore.getState()

                if (!state.token) {
                    return null
                }

                try {
                    const data: UserProfile = await authService.getProfile()
                    set({ currentUser: data })
                    return data
                } catch (err: any) {
                    set({
                        error: err.message || "Failed to fetch user information.",
                    })
                    return null
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
                currentUser: state.currentUser,
            }),
        }
    )
)
