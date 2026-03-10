import api from "./axios";

export type WalletWithdrawal = {
    walletWithdrawalId: number;
    walletId: number | null;
    amount: number | null;
    status: string | null;
    balanceBefore: number | null;
    balanceAfter: number | null;
    type: string | null;
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
};
