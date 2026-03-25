import api from "./axios";

export type Ingredient = {
    ingredientId: number;
    name: string;
    category: string;
    image?: string | null;
    createDate: string;
    endDate?: string | null;
};

export type IngredientPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: Ingredient[];
};

export type IngredientQueryParams = {
    page: number;
    pageSize: number;
    name?: string;
    category?: string;
};

export type CreateIngredientPayload = {
    ingredientId: number;
    name: string;
    category: string;
    createDate: string;
};

export type UpdateIngredientPayload = {
    ingredientId: number;
    name: string;
    category: string;
    createDate: string;
};

export const ingredientService = {
    getAll: async () => {
        return api.get("/Ingredient");
    },

    getPaginated: async (params: IngredientQueryParams) => {
        return api.get<IngredientPaginatedResponse>("/Ingredient", { params });
    },

    create: async (payload: CreateIngredientPayload) => {
        return api.post<Ingredient>("/Ingredient", payload);
    },

    update: async (id: number, payload: UpdateIngredientPayload) => {
        return api.put<Ingredient>(`/Ingredient/${id}`, payload);
    },

    delete: async (id: number) => {
        return api.delete(`/Ingredient/${id}`);
    },

    uploadImage: async (ingredientId: number, file: File) => {
        const formData = new FormData();
        formData.append("image", file, file.name);

        return api.post("/Ingredient/upload-image", formData, {
            params: { ingredientId },
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
};
