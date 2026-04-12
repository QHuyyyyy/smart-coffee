import api from "./axios";

export type Supplier = {
    supplierId: number;
    accountId?: number | null;
    supplierName?: string | null;
    address?: string | null;
    provinceId?: number | null;
    districtId?: number | null;
    wardCode?: string | null;
    rating?: number | null;
    createDate?: string | null;
    withdrawDate?: string | null;
};

export type SupplierPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: Supplier[];
};

export const supplierService = {
    getAll: async (params?: { page?: number; pageSize?: number }) => {
        const response = await api.get<SupplierPaginatedResponse>("/Supplier", { params });
        return response.data;
    },
};
