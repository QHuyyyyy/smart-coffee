import api from "./axios";

export const coffeeShopService = {
    getAll: async () => {
        return api.get("/CoffeeShop");
    },
};
