import api from "./axios";

export const shopBeverageService = {
    getByShopId: async (shopId: number | string) => {
        return api.get(`/ShopBeverage/shop/${shopId}`);
    },
};
