import api from "./axios";

type LoginPayload = {
    email: string;
    password: string;
};

type LoginResponse = {
    accessToken: string;
    refreshToken: string;
};

export const authService = {
    login: async (payload: LoginPayload) => {
        const response = await api.post<LoginResponse>("/Auth/login", payload);
        return response.data;
    },

    logout: () => {
        // Handle logout if needed
    },
};
