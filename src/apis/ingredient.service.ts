import api from "./axios";

export const ingredientService = {
    getAll: async () => {
        return api.get("/Ingredient");
    },
};
