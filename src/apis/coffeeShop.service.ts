import api from "./axios";

export type CoffeeShop = {
    coffeeShopId: number;
    shopName?: string | null;
    address?: string | null;
    provinceId?: number | null;
    districtId?: number | null;
    wardCode?: string | null;
    timestamp?: string | null;
    account?: {
        accountId?: number | null;
        userName?: string | null;
        phone?: string | null;
    } | null;
};

export type CoffeeShopPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: CoffeeShop[];
};

export const coffeeShopService = {
    getAll: async (params?: { page?: number; pageSize?: number }) => {
        const response = await api.get<CoffeeShopPaginatedResponse>("/CoffeeShop", { params });
        return response.data;
    },
};
