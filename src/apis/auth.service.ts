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

type ForgotPasswordPayload = {
    email: string;
};

type VerifyForgotPasswordOtpPayload = {
    email: string;
    otp: string;
};

type ResetPasswordPayload = {
    email: string;
    otp: string;
    newPassword: string;
};

type LoginResponse = {
    accessToken: string;
    refreshToken: string;
};

type RegisterResponse = {
    success: boolean;
    message?: string;
};

export type UpdateSupplierPayload = {
    supplierId?: number;
    accountId: number;
    supplierName: string;
    address: string;
    rating?: number;
    createDate?: string;
    withdrawDate?: string;
};

type UpdateProfilePayload = {
    phone?: string;
};

type ChangePasswordPayload = {
    oldPassword: string;
    newPassword: string;
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

    forgotPassword: async (payload: ForgotPasswordPayload) => {
        const response = await api.post<unknown>("/Auth/forgot-password", payload);
        return response.data;
    },

    verifyForgotPasswordOtp: async (payload: VerifyForgotPasswordOtpPayload) => {
        const response = await api.post<unknown>("/Auth/verify-forgot-password-otp", payload);
        return response.data;
    },

    resetPassword: async (payload: ResetPasswordPayload) => {
        const response = await api.post<unknown>("/Auth/reset-password", payload);
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

    updateSupplier: async (payload: UpdateSupplierPayload) => {
        const response = await api.put("/Auth/update-supplier", payload);
        return response.data;
    },

    updateProfile: async (payload: UpdateProfilePayload) => {
        const response = await api.put("/Auth/update-profile", payload);
        return response.data;
    },

    changePassword: async (payload: ChangePasswordPayload) => {
        const response = await api.post("/Auth/change-password", payload);
        return response.data;
    },

    uploadSupplierImage: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/Auth/upload-supplier-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

};
