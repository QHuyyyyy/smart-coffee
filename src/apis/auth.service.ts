import api from "./axios";

type LoginPayload = {
    email: string;
    password: string;
};

type RegisterPayload = {
    email: string;
    password: string;
    phone: string;
};

type VerifyOtpPayload = {
    email: string;
    otp: string;
};

type LoginResponse = {
    accessToken: string;
    refreshToken: string;
};

type RegisterResponse = {
    success: boolean;
    message?: string;
};

export const authService = {
    login: async (payload: LoginPayload) => {
        const response = await api.post<LoginResponse>("/Auth/login", payload);
        return response.data;
    },

    register: async (payload: RegisterPayload) => {
        const response = await api.post<RegisterResponse>("/Auth/register", payload);
        return response.data;
    },

    verifyOtp: async (payload: VerifyOtpPayload) => {
        const response = await api.post<LoginResponse>("/Auth/verify-otp", payload);
        return response.data;
    },

    refreshAccessToken: async (accessToken: string) => {
        const response = await api.post<LoginResponse>("/Auth/refresh-token", { accessToken });
        return response.data;
    },

    logout: async () => {
        const response = await api.post<LoginResponse>("/Auth/logout");
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get("/Auth/me");
        return response.data;
    },

};
