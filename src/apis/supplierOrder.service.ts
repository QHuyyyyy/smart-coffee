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
    getPaginatedBySupplier: async (supplierId: number, page: number, pageSize: number) => {
        return api.get<SupplierOrderPaginatedResponse>(`/Order/by-supplier/${supplierId}`, {
            params: { page, pageSize },
        });
    },

    getById: async (id: number) => {
        return api.get<SupplierOrder>(`/Order/${id}`);
    },
};
