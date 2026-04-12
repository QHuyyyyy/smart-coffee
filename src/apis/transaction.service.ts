import api from "./axios";

export type TransactionItem = {
    transactionId: number;
    userId: number;
    userName?: string;
    docNo: number | null;
    docType: string | null;
    transactionDate: string | null;
    transactionType: string | null;
    totalPrice: number | null;
    status: string | null;
    createAt: string | null;
    notes: string | null;
};

export type TransactionPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: TransactionItem[];
};

export type TransactionQueryParams = {
    page?: number;
    pageSize?: number;
    status?: string;
    transactionType?: string;
};

export type TransactionListByUserParams = {
    page?: number;
    pageSize?: number;
    status?: string;
};

type TransactionListResponse = TransactionItem[] | { items?: TransactionItem[]; data?: TransactionItem[] };

const extractTransactionItems = (data: TransactionListResponse): TransactionItem[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
};

export const transactionService = {
    getPaginated: async (params: TransactionQueryParams) => {
        const response = await api.get<TransactionPaginatedResponse>("/Transaction", { params });
        return response.data;
    },

    getListByUserId: async (userId: number) => {
        const response = await api.get<TransactionListResponse>(`/Transaction/list/${userId}`);
        return extractTransactionItems(response.data);
    },

    getListByUserIdPaginated: async (userId: number, params: TransactionListByUserParams) => {
        const response = await api.get<TransactionPaginatedResponse>(`/Transaction/list/${userId}`, { params });
        return response.data;
    },
};
