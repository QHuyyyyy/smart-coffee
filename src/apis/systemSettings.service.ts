import api from "./axios";

export type PackageLimit = {
    packageId: number;
    name: string;
    staffQuantity: number | null;
    productRecommendLimit: number | null;
    menuSuggestLimit: number | null;
    menuAnalyzeFeedbackLimit: number | null;
    inventoryForecastLimit: number | null;
    recipeRecommendLimit: number | null;
};

export type SystemSettings = {
    commissionRatePercent: number;
    packageLimits: PackageLimit[];
};

export type UpdateCommissionPayload = {
    commissionRatePercent: number;
};

export type UpdatePackageLimitPayload = {
    staffQuantity: number | null;
    productRecommendLimit: number | null;
    menuSuggestLimit: number | null;
    menuAnalyzeFeedbackLimit: number | null;
    inventoryForecastLimit: number | null;
    recipeRecommendLimit: number | null;
};

export const systemSettingsService = {
    getAll: async () => {
        return api.get<SystemSettings>("/SystemSettings");
    },
    updateCommission: async (payload: UpdateCommissionPayload) => {
        return api.put("/SystemSettings/commission", payload);
    },
    updatePackageLimits: async (packageId: number, payload: UpdatePackageLimitPayload) => {
        return api.put(`/SystemSettings/package-limits/${packageId}`, payload);
    },
};