import api from "./axios";

export type ShopStaff = {
    staffId: number;
    accountId?: number | null;
    ownerName: string | null;
    coffeeShopId?: number | null;
    fullName?: string | null;
    timeStamp?: string | null;
};

export type ShopStaffPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: ShopStaff[];
};

export const shopStaffService = {
    getAll: async (params?: { page?: number; pageSize?: number }) => {
        const response = await api.get<ShopStaffPaginatedResponse>("/ShopStaff", { params });
        return response.data;
    },
};
