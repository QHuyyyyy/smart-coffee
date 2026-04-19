import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/axios';
// import { formatVND } from '@/utils/currency';

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

const DEFAULT_DRINK_IMAGE =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAVzZS9IjcSAw4o2Xmd5dO5-iTjx_ztFrne56H-Hn_9OPHcTlDQkaKFF1lxXDgyM7dZyCY3_pBA-of-PJSxlw5H5irCy69OQkdcB0_OLDBk8y7iEtwTTGWQidBXWdLcWzbxYfz0YzVETp-lj3vbX8hVBYThGaSfTP4j3O6qyKHjQ77fp4b5IZo6Z2_k1W-hrddWxvnnK8_a7BNhmwmBynw3pKWsjiT4iWRq85QK9iBStVZ4AqZucwRHUY2h0LV-Lu5uq5bx3_pFZdk';

const STRENGTH_LEVELS = ['Very Light', 'Light', 'Medium', 'Strong', 'Very Strong'] as const;
const ACIDITY_LEVELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const;
const BITTERNESS_LEVELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const;
const SWEETNESS_LEVELS = ['Not sweet', 'Slightly sweet', 'Medium', 'Sweet', 'Very sweet'] as const;

const DEFAULT_STRENGTH = STRENGTH_LEVELS[2];
const DEFAULT_ACIDITY = ACIDITY_LEVELS[2];
const DEFAULT_BITTERNESS = BITTERNESS_LEVELS[2];
const DEFAULT_SWEETNESS = SWEETNESS_LEVELS[2];

const PRICE_OPTIONS = ['Cheap', 'Reasonable', 'A bit expensive', 'Too expensive'] as const;

const feedbackSchema = z.object({
    isFirstTimeTrying: z.enum(['yes', 'no']),
    strength: z.enum(STRENGTH_LEVELS),
    acidity: z.enum(ACIDITY_LEVELS),
    bitterness: z.enum(BITTERNESS_LEVELS),
    sweetness: z.enum(SWEETNESS_LEVELS),
    rating: z.number().min(1),
    priceRating: z.enum(PRICE_OPTIONS),
    repurchasable: z.enum(['yes', 'maybe', 'no']),
    comment: z.string(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

const defaultFeedbackValues: FeedbackFormValues = {
    strength: DEFAULT_STRENGTH,
    acidity: DEFAULT_ACIDITY,
    bitterness: DEFAULT_BITTERNESS,
    sweetness: DEFAULT_SWEETNESS,
    isFirstTimeTrying: undefined as any,
    rating: 0,
    priceRating: undefined as any,
    repurchasable: undefined as any,
    comment: '',
};

export function FeedbackPage() {
    const { id } = useParams<{ id: string }>();
    const feedbackId = id ?? '1';
    const menuItemId = Number(id) || 0;

    const [submitting, setSubmitting] = useState(false);
    const [menuItem, setMenuItem] = useState<MenuItemResponse | null>(null);
    const [loadingMenuItem, setLoadingMenuItem] = useState(false);

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: defaultFeedbackValues,
        mode: 'onChange',
    });

    const isFirstTimeTrying = form.watch('isFirstTimeTrying');
    const strength = form.watch('strength');
    const acidity = form.watch('acidity');
    const bitterness = form.watch('bitterness');
    const sweetness = form.watch('sweetness');
    const rating = form.watch('rating');
    const priceRating = form.watch('priceRating');
    const repurchasable = form.watch('repurchasable');

    useEffect(() => {
        if (!menuItemId) return;

        const fetchMenuItem = async () => {
            try {
                setLoadingMenuItem(true);
                const response = await api.get<MenuItemResponse>(`/MenuItem/${menuItemId}`);
                setMenuItem(response.data);
            } catch (error) {
                console.error('Fetch menu item error', error);
                toast.error('Khong tai duoc thong tin do uong.');
            } finally {
                setLoadingMenuItem(false);
            }
        };

        void fetchMenuItem();
    }, [menuItemId]);

    const isFormComplete = form.formState.isValid;

    const tasteProfiles = useMemo<Array<{
        key: string;
        label: string;
        value: string;
        levels: readonly string[];
        lowLabel: string;
        highLabel: string;
        onChange: (value: string) => void;
    }>>(() => {
        return [
            {
                key: 'strength',
                label: 'Strength',
                value: strength,
                levels: STRENGTH_LEVELS,
                lowLabel: 'Mild',
                highLabel: 'Bold',
                onChange: (value: string) =>
                    form.setValue('strength', value as FeedbackFormValues['strength'], { shouldValidate: true, shouldDirty: true }),
            },
            {
                key: 'acidity',
                label: 'Acidity',
                value: acidity,
                levels: ACIDITY_LEVELS,
                lowLabel: 'Flat',
                highLabel: 'Crisp',
                onChange: (value: string) =>
                    form.setValue('acidity', value as FeedbackFormValues['acidity'], { shouldValidate: true, shouldDirty: true }),
            },
            {
                key: 'bitterness',
                label: 'Bitterness',
                value: bitterness,
                levels: BITTERNESS_LEVELS,
                lowLabel: 'Smooth',
                highLabel: 'Intense',
                onChange: (value: string) =>
                    form.setValue('bitterness', value as FeedbackFormValues['bitterness'], { shouldValidate: true, shouldDirty: true }),
            },
            {
                key: 'sweetness',
                label: 'Sweetness',
                value: sweetness,
                levels: SWEETNESS_LEVELS,
                lowLabel: 'Dry',
                highLabel: 'Syrupy',
                onChange: (value: string) =>
                    form.setValue('sweetness', value as FeedbackFormValues['sweetness'], { shouldValidate: true, shouldDirty: true }),
            },
        ];
    }, [strength, acidity, bitterness, sweetness, form]);

    const handleSubmit = async (values: FeedbackFormValues) => {
        try {
            setSubmitting(true);

            const payload = {
                menuId: menuItem?.menuId,
                menuItemId,
                isFirstTimeTrying: values.isFirstTimeTrying === 'yes',
                strength: values.strength,
                acidity: values.acidity,
                bitterness: values.bitterness,
                sweetness: values.sweetness,
                rating: values.rating,
                priceRating: values.priceRating,
                repurchasable: values.repurchasable,
                comment: values.comment.trim() || undefined,
                ratedBy: 'Others',
            };

            await api.post('/Feedback/MenuItem', payload);

            toast.success('Thanks for your feedback!');
            form.reset(defaultFeedbackValues);
        } catch (error) {
            console.error('Submit feedback error', error);
            toast.error('Gui phan hoi that bai. Vui long thu lai.');
        } finally {
            setSubmitting(false);
        }
    };

    const drinkName = menuItem?.shopRecipe?.recipeName || menuItem?.shopBeverage?.name || 'Selected Drink';
    const drinkImage = menuItem?.shopRecipe?.image || menuItem?.shopBeverage?.imageUrl || DEFAULT_DRINK_IMAGE;

    return (
        <div className="min-h-screen w-full bg-[#fbf9f5] text-[#1b1c1a] antialiased">
            <header className="sticky top-0 z-50 w-full border-b border-[#d4c3bf]/30 bg-[#fbf9f5] shadow-[0px_12px_32px_rgba(27,28,26,0.04)]">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
                    <div className="text-2xl font-black tracking-tight text-[#4E342E]">SmartCoffee</div>
                    <div className="text-sm font-medium text-[#504442]">Feedback Form #{feedbackId}</div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-4xl px-6 py-10">
                <section className="mb-14 space-y-6">
                    {loadingMenuItem ? (
                        <div className="flex items-center justify-center py-14 text-sm text-[#504442]">Loading feedback page...</div>
                    ) : menuItem ? (
                        <>
                            <div className="relative overflow-hidden rounded-[2rem] shadow-[0px_12px_32px_rgba(27,28,26,0.06)]">
                                <img
                                    src={drinkImage}
                                    alt={drinkName}
                                    className="h-80 w-full object-cover md:h-105"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent p-8 md:p-12">
                                    <div className="flex h-full flex-col justify-end gap-4 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#ffdbd0]">
                                                Premium Signature
                                            </span>
                                            <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">{drinkName}</h1>
                                            <p className="mt-2 text-lg font-medium text-white/80">SmartCoffee Featured Drink</p>
                                        </div>
                                        {/* <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-md">
                                            <span className="text-2xl font-black tracking-tight text-white">
                                                {formatVND(menuItem.sellingPrice)}
                                            </span>
                                        </div> */}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row flex-wrap items-start justify-between gap-4 rounded-2xl bg-white p-6 md:flex-row md:items-center">
                                <div>
                                    <p className="text-lg font-bold text-[#1b1c1a]">First-time trying this?</p>
                                    <p className="text-sm text-[#504442]">Tell us whether this is your debut experience.</p>
                                </div>
                                <div className="flex gap-3 sm:ml-auto">
                                    <button
                                        type="button"
                                        className={`rounded-xl border px-5 py-2 text-sm font-bold transition-all ${isFirstTimeTrying === 'yes'
                                            ? 'border-[#371f17] bg-[#371f17] text-white'
                                            : 'border-[#d4c3bf] bg-white text-[#504442] hover:bg-[#efeeea]'
                                            }`}
                                        onClick={() => form.setValue('isFirstTimeTrying', 'yes', { shouldValidate: true, shouldDirty: true })}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        className={`rounded-xl border px-5 py-2 text-sm font-bold transition-all ${isFirstTimeTrying === 'no'
                                            ? 'border-[#371f17] bg-[#371f17] text-white'
                                            : 'border-[#d4c3bf] bg-white text-[#504442] hover:bg-[#efeeea]'
                                            }`}
                                        onClick={() => form.setValue('isFirstTimeTrying', 'no', { shouldValidate: true, shouldDirty: true })}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center py-14 text-sm text-red-500">
                            No drink information available for this feedback.
                        </div>
                    )}
                </section>

                <form className="space-y-16" onSubmit={form.handleSubmit(handleSubmit)}>
                    <section className="space-y-10">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-[#1b1c1a]">Taste Profile</h2>
                            <p className="mt-2 text-sm text-[#504442]">Help us understand the balance of your brew.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
                            {tasteProfiles.map((profile) => {
                                const selectedIndex = Math.max(0, profile.levels.indexOf(profile.value as never));
                                return (
                                    <div key={profile.key} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-[#1b1c1a]">{profile.label}</label>
                                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#805521]">
                                                {profile.value || 'Choose'}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={profile.levels.length - 1}
                                            step={1}
                                            value={selectedIndex}
                                            onChange={(e) => profile.onChange(profile.levels[Number(e.target.value)])}
                                            className="h-2 w-full cursor-pointer rounded-lg bg-[#d4c3bf] accent-[#371f17]"
                                        />
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#827471]">
                                            <span>{profile.lowLabel}</span>
                                            <span>{profile.highLabel}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    <section className="space-y-5 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-[#1b1c1a]">Overall Experience</h2>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((starValue) => (
                                <button
                                    key={starValue}
                                    type="button"
                                    className="p-1"
                                    onClick={() => form.setValue('rating', starValue, { shouldValidate: true, shouldDirty: true })}
                                >
                                    <span
                                        className={`material-symbols-outlined text-5xl ${rating >= starValue ? 'text-[#805521]' : 'text-[#d4c3bf]'}`}
                                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 48" }}
                                    >
                                        star
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                    <section className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-[#1b1c1a]">Price and Value</h2>
                            <p className="mt-2 text-sm text-[#504442]">How do you feel about the investment for this cup?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {PRICE_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => form.setValue('priceRating', option, { shouldValidate: true, shouldDirty: true })}
                                    className={`rounded-2xl border  px-10 py-4  text-center text-sm font-bold transition-all ${priceRating === option
                                        ? 'border-[#371f17] bg-[#371f17] text-white shadow-[0px_12px_32px_rgba(55,31,23,0.15)]'
                                        : 'border-[#d4c3bf] bg-white text-[#504442] hover:bg-[#efeeea]'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6 rounded-3xl bg-[#eae8e4] p-8 text-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-[#1b1c1a]">Would you order this again?</h2>
                            <p className="mt-2 text-sm text-[#504442]">Your loyalty is our highest reward.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => form.setValue('repurchasable', 'yes', { shouldValidate: true, shouldDirty: true })}
                                className={`rounded-xl px-10 py-4 text-sm  font-bold transition-all ${repurchasable === 'yes'
                                    ? 'bg-[#371f17] text-white shadow-[0px_12px_32px_rgba(55,31,23,0.15)]'
                                    : 'border border-[#d4c3bf] bg-white text-[#1b1c1a] hover:bg-[#efeeea]'
                                    }`}
                            >
                                Yes, Absolutely
                            </button>
                            <button
                                type="button"
                                onClick={() => form.setValue('repurchasable', 'maybe', { shouldValidate: true, shouldDirty: true })}
                                className={`rounded-xl px-10 py-4 text-sm  font-bold transition-all ${repurchasable === 'maybe'
                                    ? 'bg-[#805521] text-white shadow-[0px_12px_32px_rgba(128,85,33,0.2)]'
                                    : 'border border-[#d4c3bf] bg-white text-[#1b1c1a] hover:bg-[#efeeea]'
                                    }`}
                            >
                                Maybe
                            </button>
                            <button
                                type="button"
                                onClick={() => form.setValue('repurchasable', 'no', { shouldValidate: true, shouldDirty: true })}
                                className={`rounded-xl px-10 py-4 text-sm font-bold transition-all ${repurchasable === 'no'
                                    ? 'bg-[#ba1a1a] text-white shadow-[0px_12px_32px_rgba(186,26,26,0.2)]'
                                    : 'border border-[#d4c3bf] bg-white text-[#1b1c1a] hover:bg-[#efeeea]'
                                    }`}
                            >
                                No
                            </button>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-[#1b1c1a]">Optional feedback</h2>
                        </div>
                        <textarea
                            id="comment"
                            {...form.register('comment')}
                            rows={5}
                            placeholder="Write your thoughts here..."
                            className="w-full resize-none rounded-2xl border border-[#d4c3bf] bg-[#efeeea] p-6 text-[#1b1c1a] placeholder:text-[#827471] outline-none transition-all focus:border-[#827471] focus:bg-white"
                        />
                    </section>

                    <div className="pt-4 text-center">
                        <button
                            type="submit"
                            disabled={submitting || !isFormComplete || loadingMenuItem || !menuItem}
                            className="w-full rounded-full bg-linear-to-br from-[#371f17] to-[#4f342b] px-16 py-5 text-xl font-extrabold text-white shadow-[0px_20px_40px_rgba(55,31,23,0.2)] transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-[#9b9089] disabled:shadow-none md:w-auto"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                        {!isFormComplete && (
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#805521]">
                                Thanks for taking the time to share your feedback! Please complete all required fields before submitting.
                            </p>
                        )}
                    </div>
                </form>
            </main>

            <footer className="py-8 text-center text-sm text-[#504442]">GSP25SE50</footer>
        </div>
    );
}
