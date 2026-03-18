import api from "./axios";

export type SubscriptionPackageInfo = {
    packageId: number;
    name: string | null;
    description: string | null;
    price: number | null;
    timeStamp: string | null;
    staffQuantity: number | null;
};

export type Subscription = {
    subscriptionId: number;
    packageId: number | null;
    ownerId: number | null;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
    timeStamp: string | null;
    package?: SubscriptionPackageInfo | null;
};

export type SubscriptionPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: Subscription[];
};

export const subscriptionService = {
    getPaginated: async (page: number, pageSize: number) => {
        return api.get<SubscriptionPaginatedResponse>("/Subscription", {
            params: {
                page,
                pageSize,
            },
        });
    },
};
