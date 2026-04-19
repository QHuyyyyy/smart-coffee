import api from "../axios";

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

export type RevenueResponse = {
    revenueType?: string;
    fromDate?: string;
    toDate?: string;
    totalRevenue: number;
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

    getShippingRevenue: async (fromDate?: string, toDate?: string) => {
        const response = await api.get<RevenueResponse>(`/order/revenue/shipping`, { params: { fromDate, toDate } });
        return response.data.totalRevenue;
    },

    getSupplierRevenue: async (supplierId: number, fromDate?: string, toDate?: string) => {
        const response = await api.get<RevenueResponse>(`/Order/revenue/supplier/${supplierId}`, { params: { fromDate, toDate } });
        return response.data.totalRevenue;
    },
};
