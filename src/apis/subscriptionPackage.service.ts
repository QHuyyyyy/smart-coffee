import api from "./axios";

export type SubscriptionPackage = {
    packageId: number;
    name: string;
    description: string;
    price: number;
    timeStamp: string;
    staffQuantity: number;
};

export const subscriptionPackageService = {
    getAll: async () => {
        return api.get<SubscriptionPackage[]>("/SubscriptionPackage");
    },
    create: async (payload: Omit<SubscriptionPackage, "packageId" | "timeStamp">) => {
        // timeStamp is set by backend
        return api.post<SubscriptionPackage>("/SubscriptionPackage", {
            ...payload,
            timeStamp: new Date().toISOString(),
        });
    },
    update: async (id: number, payload: Omit<SubscriptionPackage, "packageId" | "timeStamp">) => {
        return api.put(`/SubscriptionPackage/${id}`, {
            packageId: id,
            ...payload,
        });
    },
};
