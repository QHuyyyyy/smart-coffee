import api from "./axios";

export type SystemOrder = {
    orderId: number;
    ownerName: string;
    totalPrice: number;
    status: string;
    // Allow additional fields from the API without strict typing
    [key: string]: any;
};

export type SystemOrderPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages?: number;
    items: SystemOrder[];
};

export const orderService = {
    getPaginated: async (page: number, pageSize: number, orderStatus?: string) => {
        return api.get<SystemOrderPaginatedResponse>(`/Order`, {
            params: {
                page,
                pageSize,
                orderStatus,
            },
        });
    },

    getById: async (id: number) => {
        return api.get<SystemOrder>(`/Order/${id}`);
    },

    updateStatus: async (id: number, status: string) => {
        return api.patch<SystemOrder>(`/Order/${id}/status`, { status });
    },
};
