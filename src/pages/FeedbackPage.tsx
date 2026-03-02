import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../apis/axios';

interface IngredientResponse {
    id: number;
    quantity: number;
    cost: number;
    measurement: string;
    ingredient_id: number;
    ingredient?: {
        ingredientId: number;
        name: string;
        category: string;
        image?: string | null;
    };
}

interface ShopRecipeResponse {
    recipeId: number;
    recipeName: string;
    image?: string | null;
    ingredients?: IngredientResponse[];
}

interface MenuItemResponse {
    menuItemId: number;
    menuId: number;
    description?: string | null;
    sellingPrice: number;
    addedDate: string;
    shopRecipe?: ShopRecipeResponse | null;
    shopBeverage?: {
        beverageId: number;
        name: string;
        status: string;
        beverageCategoryId: number;
        beverageCategoryName: string;
        imageUrl?: string | null;
    } | null;
}

interface MenuGroupResponse {
    menuGroupId: number;
    name: string;
    orderIndex: number;
    menuItems: MenuItemResponse[];
}

interface MenuResponse {
    menuId: number;
    menuHeaderId: number;
    versionNumber: string;
    status: string;
    created: string;
    isActive: boolean;
    image?: string | null;
    menuGroups: MenuGroupResponse[];
}

const DEFAULT_DRINK_IMAGE =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAVzZS9IjcSAw4o2Xmd5dO5-iTjx_ztFrne56H-Hn_9OPHcTlDQkaKFF1lxXDgyM7dZyCY3_pBA-of-PJSxlw5H5irCy69OQkdcB0_OLDBk8y7iEtwTTGWQidBXWdLcWzbxYfz0YzVETp-lj3vbX8hVBYThGaSfTP4j3O6qyKHjQ77fp4b5IZo6Z2_k1W-hrddWxvnnK8_a7BNhmwmBynw3pKWsjiT4iWRq85QK9iBStVZ4AqZucwRHUY2h0LV-Lu5uq5bx3_pFZdk";

export function FeedbackPage() {
    const { id } = useParams<{ id: string }>();
    const feedbackId = id ?? '1';
    // id trên URL là menuItemId
    const menuItemId = Number(id) || 0;

    const [isFirstTimeTrying, setIsFirstTimeTrying] = useState<boolean | null>(null);
    const [strength, setStrength] = useState('');
    const [acidity, setAcidity] = useState('');
    const [bitterness, setBitterness] = useState('');
    const [sweetness, setSweetness] = useState('');
    const [rating, setRating] = useState(0);
    const [priceRating, setPriceRating] = useState('');
    const [repurchasable, setRepurchasable] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [menuItem, setMenuItem] = useState<MenuItemResponse | null>(null);
    const [loadingMenuItem, setLoadingMenuItem] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
    const [loadingMenu, setLoadingMenu] = useState(false);

    useEffect(() => {
        if (!menuItemId) {
            return;
        }

        const fetchMenuItem = async () => {
            try {
                setLoadingMenuItem(true);
                const response = await api.get<MenuItemResponse>(`/MenuItem/${menuItemId}`);
                setMenuItem(response.data);
            } catch (error) {
                console.error('Fetch menu item error', error);
                toast.error('Không tải được thông tin đồ uống.');
            } finally {
                setLoadingMenuItem(false);
            }
        };

        fetchMenuItem();
    }, [menuItemId]);

    // Sau khi biết menuId từ menuItem, gọi tiếp /Menu/{menuId} để lấy các menu items khác
    useEffect(() => {
        if (!menuItem?.menuId) {
            return;
        }

        const fetchMenu = async () => {
            try {
                setLoadingMenu(true);
                const response = await api.get<MenuResponse>(`/Menu/${menuItem.menuId}`);
                const groups = response.data.menuGroups ?? [];
                const items = groups.flatMap((g) => g.menuItems ?? []);
                setMenuItems(items);
            } catch (error) {
                console.error('Fetch menu error', error);
                toast.error('Không tải được danh sách đồ uống trong menu.');
            } finally {
                setLoadingMenu(false);
            }
        };

        fetchMenu();
    }, [menuItem?.menuId]);

    const orderedMenuItems = menuItems.slice().sort((a, b) => {
        if (!menuItem) return 0;
        if (a.menuItemId === menuItem.menuItemId) return -1;
        if (b.menuItemId === menuItem.menuItemId) return 1;
        return 0;
    });

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            const payload = {
                // Backend đang mong đợi menuId (thực chất là menuItemId được gửi từ URL)
                menuId: menuItemId,
                isFirstTimeTrying: isFirstTimeTrying ?? undefined,
                strength: strength || undefined,
                acidity: acidity || undefined,
                bitterness: bitterness || undefined,
                sweetness: sweetness || undefined,
                rating,
                priceRating: priceRating || undefined,
                repurchasable: repurchasable || undefined
            };

            await api.post('/Feedback/MenuItem', payload);

            toast.success('Gửi phản hồi thành công! Cảm ơn bạn.');

            // Reset form state after successful submit
            setIsFirstTimeTrying(null);
            setStrength('');
            setAcidity('');
            setBitterness('');
            setSweetness('');
            setRating(0);
            setPriceRating('');
            setRepurchasable('');
        } catch (error) {
            console.error('Submit feedback error', error);
            toast.error('Gửi phản hồi thất bại. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#1b140d] dark:text-gray-100 min-h-screen w-full overflow-x-hidden transition-colors duration-200">
            <div className="relative flex min-h-screen w-full flex-col">
                <header className="w-full bg-white dark:bg-[#1a120b] border-b border-[#e7dbcf] dark:border-[#3a2c22] sticky top-0 z-50">
                    <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-3xl">local_cafe</span>
                            <h1 className="text-xl font-bold tracking-tight">SmartCoffee</h1>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Feedback Form #{feedbackId}</div>
                    </div>
                </header>

                <main className="flex-grow w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                    <div className="flex flex-col gap-2 mb-8">
                        <h2 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#1b140d] dark:text-white">
                            Coffee Drink Feedback
                        </h2>
                        <p className="text-[#9a734c] dark:text-[#c49a6c] text-lg font-normal">
                            We value your opinion! Tell us about your recent brew to help us improve.
                        </p>
                    </div>

                    {/* Drink Information */}
                    <section className="bg-white dark:bg-[#1a120b] rounded-xl shadow-sm border border-[#e7dbcf] dark:border-[#3a2c22] p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <h3 className="text-xl font-bold">Drink Information</h3>
                        </div>

                        <div className="mb-6">
                            {loadingMenuItem || loadingMenu ? (
                                <div className="flex items-center justify-center py-10 text-sm text-[#9a734c]">
                                    Đang tải thông tin menu...
                                </div>
                            ) : orderedMenuItems.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                                    {orderedMenuItems.map((item) => {
                                        const isSelected = item.menuItemId === menuItem?.menuItemId;
                                        const name = item.shopRecipe?.recipeName || item.shopBeverage?.name || 'Đồ uống';
                                        const sellingPrice = item.sellingPrice || '';
                                        const imageUrl = item.shopRecipe?.image || item.shopBeverage?.imageUrl || DEFAULT_DRINK_IMAGE;

                                        return (
                                            <label
                                                key={item.menuItemId}
                                                className="cursor-pointer group min-w-[150px] sm:min-w-[180px] md:min-w-[200px]"
                                            >
                                                <input
                                                    className="peer sr-only"
                                                    name="drink_type"
                                                    type="radio"
                                                    checked={isSelected}
                                                    readOnly
                                                />
                                                <div className="flex flex-col gap-3 pb-3 p-3 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-gray-50 dark:hover:bg-[#2c2016] transition-all">
                                                    <div className="w-full aspect-square bg-center bg-cover rounded-lg overflow-hidden relative">
                                                        <div className="absolute inset-0 bg-black/10" />
                                                        <div
                                                            className="w-full h-full bg-cover bg-center"
                                                            data-alt={name}
                                                            style={{
                                                                backgroundImage: `url('${imageUrl}')`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-[#1b140d] dark:text-white text-base font-bold leading-normal">{name}</p>
                                                        {sellingPrice && (
                                                            <p className="text-[#9a734c] text-sm font-normal leading-normal">{sellingPrice} VND</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-10 text-sm text-red-500">
                                    Không tìm thấy danh sách đồ uống trong menu.
                                </div>
                            )}
                        </div>

                        {menuItem && (
                            <p className="text-sm text-[#9a734c] mb-4">
                                Bạn đang đánh giá:{' '}
                                <span className="font-semibold">
                                    {menuItem.shopRecipe?.recipeName || menuItem.shopBeverage?.name || 'Đồ uống đã chọn'}
                                </span>
                            </p>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#fcfaf8] dark:bg-[#2c2016] rounded-lg">
                            <span className="text-base font-medium text-[#1b140d] dark:text-white">
                                Is this your first time trying this drink?
                            </span>
                            <div className="flex gap-2">
                                <label className="has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-[#1a120b] px-6 py-2 rounded-lg transition-colors font-medium text-sm">
                                    Yes
                                    <input
                                        className="sr-only"
                                        name="first_time"
                                        type="radio"
                                        value="yes"
                                        onChange={() => setIsFirstTimeTrying(true)}
                                    />
                                </label>
                                <label className="has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary cursor-pointer border border-[#e7dbcf] dark:border-[#4a3b2f] bg-white dark:bg-[#1a120b] px-6 py-2 rounded-lg transition-colors font-medium text-sm">
                                    No
                                    <input
                                        className="sr-only"
                                        name="first_time"
                                        type="radio"
                                        value="no"
                                        onChange={() => setIsFirstTimeTrying(false)}
                                    />
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Remaining sections copied from template */}
                    {/* Overall Rating */}
                    <section className="bg-white dark:bg-[#1a120b] rounded-xl shadow-sm border border-[#e7dbcf] dark:border-[#3a2c22] p-6 sm:p-8 text-center">
                        <h3 className="text-xl font-bold mb-2">Overall Rating</h3>
                        <p className="text-[#9a734c] mb-6">How was your experience overall?</p>
                        <div className="flex justify-center flex-row-reverse gap-2 group/rating">
                            {[5, 4, 3, 2, 1].map((starValue) => {
                                const filled = rating >= starValue;
                                return (
                                    <button
                                        type="button"
                                        key={starValue}
                                        onClick={() => setRating(starValue)}
                                        className="focus:outline-none"
                                    >
                                        <span
                                            className={`material-symbols-outlined text-4xl cursor-pointer transition-colors ${filled ? 'text-primary' : 'text-[#e7dbcf]'}`}
                                        >
                                            star
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Taste Profile */}
                    <section className="bg-white dark:bg-[#1a120b] rounded-xl shadow-sm border border-[#e7dbcf] dark:border-[#3a2c22] p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">psychiatry</span>
                            <h3 className="text-xl font-bold">Taste Profile</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-3">Strength</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="strength"
                                            type="radio"
                                            value="light"
                                            checked={strength === 'light'}
                                            onChange={() => setStrength('light')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Light
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="strength"
                                            type="radio"
                                            value="medium"
                                            checked={strength === 'medium'}
                                            onChange={() => setStrength('medium')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Medium
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="strength"
                                            type="radio"
                                            value="strong"
                                            checked={strength === 'strong'}
                                            onChange={() => setStrength('strong')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Strong
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3">Acidity</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="acidity"
                                            type="radio"
                                            value="low"
                                            checked={acidity === 'low'}
                                            onChange={() => setAcidity('low')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Low
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="acidity"
                                            type="radio"
                                            value="medium"
                                            checked={acidity === 'medium'}
                                            onChange={() => setAcidity('medium')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Medium
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="acidity"
                                            type="radio"
                                            value="high"
                                            checked={acidity === 'high'}
                                            onChange={() => setAcidity('high')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            High
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3">Bitterness</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="bitterness"
                                            type="radio"
                                            value="low"
                                            checked={bitterness === 'low'}
                                            onChange={() => setBitterness('low')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Low
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="bitterness"
                                            type="radio"
                                            value="medium"
                                            checked={bitterness === 'medium'}
                                            onChange={() => setBitterness('medium')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Medium
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="bitterness"
                                            type="radio"
                                            value="high"
                                            checked={bitterness === 'high'}
                                            onChange={() => setBitterness('high')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            High
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3">Sweetness</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="sweetness"
                                            type="radio"
                                            value="not_sweet"
                                            checked={sweetness === 'not_sweet'}
                                            onChange={() => setSweetness('not_sweet')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Not sweet
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="sweetness"
                                            type="radio"
                                            value="medium"
                                            checked={sweetness === 'medium'}
                                            onChange={() => setSweetness('medium')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Medium
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            className="peer sr-only"
                                            name="sweetness"
                                            type="radio"
                                            value="sweet"
                                            checked={sweetness === 'sweet'}
                                            onChange={() => setSweetness('sweet')}
                                        />
                                        <div className="text-center py-2 px-3 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] text-sm font-medium text-gray-600 dark:text-gray-300 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                                            Sweet
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Price & Value */}
                    <section className="bg-white dark:bg-[#1a120b] rounded-xl shadow-sm border border-[#e7dbcf] dark:border-[#3a2c22] p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            <h3 className="text-xl font-bold">Price &amp; Value</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-semibold mb-3">How was the price?</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-3 p-3 border border-[#e7dbcf] dark:border-[#3a2c22] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2016] transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                            className="accent-primary w-4 h-4 text-primary"
                                            name="price_perception"
                                            type="radio"
                                            value="cheap"
                                            checked={priceRating === 'cheap'}
                                            onChange={() => setPriceRating('cheap')}
                                        />
                                        <span className="text-sm font-medium">Cheap</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-[#e7dbcf] dark:border-[#3a2c22] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2016] transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                            className="accent-primary w-4 h-4 text-primary"
                                            name="price_perception"
                                            type="radio"
                                            value="reasonable"
                                            checked={priceRating === 'reasonable'}
                                            onChange={() => setPriceRating('reasonable')}
                                        />
                                        <span className="text-sm font-medium">Reasonable</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-[#e7dbcf] dark:border-[#3a2c22] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2016] transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                            className="accent-primary w-4 h-4 text-primary"
                                            name="price_perception"
                                            type="radio"
                                            value="bit_expensive"
                                            checked={priceRating === 'bit_expensive'}
                                            onChange={() => setPriceRating('bit_expensive')}
                                        />
                                        <span className="text-sm font-medium">A bit expensive</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-[#e7dbcf] dark:border-[#3a2c22] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2016] transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                            className="accent-primary w-4 h-4 text-primary"
                                            name="price_perception"
                                            type="radio"
                                            value="too_expensive"
                                            checked={priceRating === 'too_expensive'}
                                            onChange={() => setPriceRating('too_expensive')}
                                        />
                                        <span className="text-sm font-medium">Too expensive</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Repurchase Intent */}
                    <section className="bg-white dark:bg-[#1a120b] rounded-xl shadow-sm border border-[#e7dbcf] dark:border-[#3a2c22] p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">favorite</span>
                            <h3 className="text-xl font-bold">Repurchase Intent</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-6">
                                <span className="font-medium text-base">Will you order this drink again?</span>
                                <div className="flex gap-2">
                                    <label className="cursor-pointer group">
                                        <input
                                            className="peer sr-only"
                                            name="order_again"
                                            type="radio"
                                            value="yes"
                                            checked={repurchasable === 'yes'}
                                            onChange={() => setRepurchasable('yes')}
                                        />
                                        <span className="px-5 py-2 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] peer-checked:bg-green-100 peer-checked:text-green-800 peer-checked:border-green-300 dark:peer-checked:bg-green-900 dark:peer-checked:text-green-100 font-medium text-sm block transition-all">
                                            Yes
                                        </span>
                                    </label>
                                    <label className="cursor-pointer group">
                                        <input
                                            className="peer sr-only"
                                            name="order_again"
                                            type="radio"
                                            value="maybe"
                                            checked={repurchasable === 'maybe'}
                                            onChange={() => setRepurchasable('maybe')}
                                        />
                                        <span className="px-5 py-2 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] peer-checked:bg-yellow-100 peer-checked:text-yellow-800 peer-checked:border-yellow-300 dark:peer-checked:bg-yellow-900 dark:peer-checked:text-yellow-100 font-medium text-sm block transition-all">
                                            Maybe
                                        </span>
                                    </label>
                                    <label className="cursor-pointer group">
                                        <input
                                            className="peer sr-only"
                                            name="order_again"
                                            type="radio"
                                            value="no"
                                            checked={repurchasable === 'no'}
                                            onChange={() => setRepurchasable('no')}
                                        />
                                        <span className="px-5 py-2 rounded-lg border border-[#e7dbcf] dark:border-[#3a2c22] peer-checked:bg-red-100 peer-checked:text-red-800 peer-checked:border-red-300 dark:peer-checked:bg-red-900 dark:peer-checked:text-red-100 font-medium text-sm block transition-all">
                                            No
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col items-center gap-6 py-4">
                        <p className="text-[#9a734c] text-sm">Thank you for helping us make our coffee better!</p>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full sm:w-auto bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-full hover:bg-[#b8610b] active:scale-95 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                        >
                            <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
                            <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                    </div>
                </main>

                <footer className="w-full py-8 text-center text-[#9a734c] text-sm dark:text-[#6a5342]">
                    © 2023 Bean &amp; Brew Co.
                </footer>
            </div>
        </div>
    );
}
