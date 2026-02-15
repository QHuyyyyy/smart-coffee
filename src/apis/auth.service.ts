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

    logout: async () => {
        const response = await api.post<LoginResponse>("/Auth/logout");
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get("/Auth/profile");
        return response.data;
    },

};
