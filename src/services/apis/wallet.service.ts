import api from "../axios";

export type WalletWithdrawal = {
    walletWithdrawalId: number;
    walletId: number | null;
    amount: number | null;
    status: string | null;
    balanceBefore: number | null;
    balanceAfter: number | null;
    createAt: string | null;
};

export type Wallet = {
    walletId: number;
    accountId: number;
    availableBalance: number;
    heldBalance: number;
    currency: string;
    bankName: string | null;
    bankAccountNumber: string | null;
    updatedAt: string;
    account: unknown | null;
    walletWithdrawals: WalletWithdrawal[];
};

export type SupplierWalletWithdrawal = {
    withdrawId: number;
    amount: number | null;
    status: string | null;
    balanceBefore: number | null;
    balanceAfter: number | null;
    createAt: string | null;
};

export type SupplierWalletWithdrawalsResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: SupplierWalletWithdrawal[];
};

export type UpdateBankInfoPayload = {
    bankName: string;
    bankAccountNumber: string;
};

export const walletService = {
    getWalletById: async (walletId: number) => {
        const response = await api.get<Wallet>(`/Wallet/${walletId}`);
        return response.data;
    },

    updateBankInfo: async (walletId: number, payload: UpdateBankInfoPayload) => {
        const response = await api.put<Wallet>(`/Wallet/${walletId}/bank-info`, payload);
        return response.data;
    },

    // Supplier: request a new withdrawal
    createWithdraw: async (payload: { amount: number }) => {
        const response = await api.post<{ withdrawId: number }>("/Wallet/withdraw", payload);
        return response.data;
    },

    // Supplier: verify withdrawal via OTP sent by email
    verifyWithdraw: async (payload: { withdrawId: number; otpCode: string }) => {
        const response = await api.post("/Wallet/verify-withdraw", payload);
        return response.data;
    },

    // Supplier/Admin: update withdrawal status (Cancelled by supplier, or Processing/Rejected/Completed by admin)
    updateWithdrawStatus: async (withdrawId: number, payload: { status: string }) => {
        const response = await api.patch(`/Wallet/withdraw/${withdrawId}/status`, payload);
        return response.data;
    },

    // Admin: list withdrawals with optional filters
    getWithdrawals: async (params: { status?: string; pageSize?: number; page?: number }) => {
        const response = await api.get("/Wallet/withdrawals", { params });
        return response.data;
    },

    // Supplier: list withdrawal history by wallet id
    getWithdrawalsByWalletId: async (
        walletId: number,
        params: { status?: string; pageSize?: number; page?: number },
    ) => {
        const response = await api.get<SupplierWalletWithdrawalsResponse>(`/Wallet/withdrawals/by-wallet/${walletId}`, {
            params,
        });
        return response.data;
    },
};
