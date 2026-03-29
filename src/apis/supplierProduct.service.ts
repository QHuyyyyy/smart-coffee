import api from "./axios";

export type SupplierProduct = {
    productId: number;
    supplierId: number;
    ingredientId: number;
    price: number;
    stock: number;
    holdStock?: number | null;
    rating?: number | null;
    // packageSize: khối lượng của 1 túi bán ra (theo measurement)
    packageSize?: number | null;
    status: string;
    description?: string | null;
    createDate: string;
    measurement: string;
    image?: string | null;
    ingredient?: {
        ingredientId: number;
        name: string;
        category?: string | null;
        image?: string | null;
    } | null;
};

export type SupplierProductPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: SupplierProduct[];
};

export type UpdateSupplierProductPayload = {
    productId: number;
    supplierId: number;
    ingredientId: number;
    price: number;
    stock: number;
    holdStock?: number | null;
    rating?: number | null;
    packageSize?: number | null;
    status: string;
    description?: string | null;
    createDate: string;
    measurement: string;
    image?: string | null;
    ingredient?: {
        ingredientId: number;
        name: string;
        category?: string | null;
        image?: string | null;
    } | null;
};

type ExistingIngredientPayload = {
    supplierId: number;
    ingredientId: number;
    price: number;
    stock: number;
    holdStock?: number | null;
    packageSize?: number | null;
    status: string;
    measurement: string;
    description?: string;
};

type NewIngredientPayload = {
    supplierId: number;
    ingredient: {
        name: string;
        category: string;
    };
    price: number;
    stock: number;
    holdStock?: number | null;
    packageSize?: number | null;
    status: string;
    measurement: string;
    description?: string;
};

export type CreateSupplierProductPayload = ExistingIngredientPayload | NewIngredientPayload;

export const supplierProductService = {
    getPaginatedBySupplier: async (supplierId: number, page: number, pageSize: number) => {
        return api.get<SupplierProductPaginatedResponse>(`/SupplierProduct/by-supplier/${supplierId}`, {
            params: { page, pageSize },
        });
    },

    create: async (payload: CreateSupplierProductPayload) => {
        return api.post<SupplierProduct>("/SupplierProduct", payload);
    },

    update: async (id: number, payload: UpdateSupplierProductPayload) => {
        return api.put<SupplierProduct>(`/SupplierProduct/${id}`, payload);
    },

    delete: async (id: number) => {
        return api.delete(`/SupplierProduct/${id}`);
    },

    getById: async (id: number) => {
        return api.get<SupplierProduct>(`/SupplierProduct/${id}`);
    },

    uploadImage: async (productId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        return api.post(`/SupplierProduct/${productId}/upload-image`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
};
