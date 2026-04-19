
import api from "../axios";

export const recipeService = {
    getAllRecipes: async () => {
        return api.get("/ShopRecipe");
    },
    getPaginatedRecipes: async (isPublic: "none" | "true" | "false" | undefined, page: number, pageSize: number) => {
        return api.get("/ShopRecipe", {
            params: {
                isPublic,
                page,
                pageSize,
            },
        });
    },
    getRecipeById: async (id: string) => {
        return api.get(`/ShopRecipe/${id}`);
    },
    getIngredientsByRecipeId: async (recipeId: number | string) => {
        return api.get(`/ShopRecipeIngredients/by-recipe/${recipeId}`);
    },
    createRecipe: async (data: any) => {
        return api.post("/ShopRecipe", data);
    }
};