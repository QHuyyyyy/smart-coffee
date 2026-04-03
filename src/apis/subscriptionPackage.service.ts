import api from "./axios";

export type SubscriptionPackage = {
    packageId: number;
    name: string;
    description: string;
    price: number;
    timeStamp: string | null;
    staffQuantity: number | null;
    menuSuggestLimit: number | null;
    recipeRecommendLimit: number | null;
    productRecommendLimit: number | null;
    menuAnalyzeFeedbackLimit: number | null;
    inventoryForecastLimit: number | null;
};

export type UpsertSubscriptionPackagePayload = {
    name: string;
    description: string;
    price: number;
    staffQuantity: number | null;
    menuSuggestLimit: number | null;
    recipeRecommendLimit: number | null;
    productRecommendLimit: number | null;
    menuAnalyzeFeedbackLimit: number | null;
    inventoryForecastLimit: number | null;
};

export const subscriptionPackageService = {
    getAll: async () => {
        return api.get<SubscriptionPackage[]>("/SubscriptionPackage");
    },
    create: async (payload: UpsertSubscriptionPackagePayload) => {
        // timeStamp is set by backend
        return api.post<SubscriptionPackage>("/SubscriptionPackage", {
            ...payload,
            timeStamp: new Date().toISOString(),
        });
    },
    update: async (id: number, payload: UpsertSubscriptionPackagePayload) => {
        return api.put(`/SubscriptionPackage/${id}`, {
            packageId: id,
            ...payload,
        });
    },
    delete: async (id: number) => {
        return api.delete(`/SubscriptionPackage/${id}`);
    },
};
