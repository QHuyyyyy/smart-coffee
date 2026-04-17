import api from "./axios";

export type SupplierOrder = {
    orderId: number;
    totalPrice: number;
    status: string;
    // Allow additional fields from the API without strict typing
    [key: string]: any;
};

export type SupplierOrderPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages?: number;
    items: SupplierOrder[];
};

export const supplierOrderService = {
    getPaginatedBySupplier: async (supplierId: number, page: number, pageSize: number, orderStatus?: string) => {
        return api.get<SupplierOrderPaginatedResponse>(`/Order/by-supplier/${supplierId}`, {
            params: {
                page,
                pageSize,
                orderStatus,
            },
        });
    },

    getById: async (id: number) => {
        return api.get<SupplierOrder>(`/Order/${id}`);
    },

    shipWithGHN: async (id: number) => {
        return api.post(`/Order/${id}/ship-ghn`);
    },

    updateStatus: async (id: number, status: string) => {
        return api.patch<SupplierOrder>(`/Order/${id}/status`, { status });
    },

    cancelWithReason: async (id: number, reasonCancel: string) => {
        return api.patch<SupplierOrder>(`/Order/${id}/reason-cancel`, {
            reason_cancel: reasonCancel,
        });
    },

    // Staging/test only: trigger GHN webhook manually
    triggerGhnWebhook: async (orderCode: string, status: string) => {
        return api.post(`/GHN/webhook`, {
            OrderCode: orderCode,
            Status: status,
        });
    },

    // Trigger cron-like auto-completion for all Delivered orders
    autoCompleteDelivered: async () => {
        return api.post(`/Order/auto-complete-delivered`);
    },
};
