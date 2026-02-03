import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";

export function LoginPage() {
    const navigate = useNavigate();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigate("/dashboard");
    };

    return (
        <AuthLayout>
            <div className="flex items-center justify-between mb-10 ml-auto">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4b2c20] text-3xl">coffee</span>
                    <span className="text-2xl font-bold text-[#4b2c20] tracking-tight">SmartCoffee</span>
                </div>
            </div>

            <div className="w-full">
                <AuthHeader
                    title="Welcome back!"
                    subtitle="Sign in to continue your coffee journey."
                />

                <AuthTabs active="signin" />

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <AuthField
                        id="email"
                        label="Email or Phone Number"
                        placeholder="Enter your email "
                        type="text"
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block ml-1" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <AuthField
                                id="password"
                                label=""
                                type="password"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4b2c20] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[22px]">visibility_off</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm py-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-md border-slate-300 text-[#4b2c20] focus:ring-[#4b2c20] cursor-pointer"
                            />
                            <span className="text-slate-600 font-medium">Remember me</span>
                        </label>
                        <button
                            type="button"
                            className="text-[#4b2c20] hover:underline font-semibold transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        variant="coffee"
                        size="xl"
                        className="w-full font-bold active:scale-[0.99] mt-4"

                    >
                        Sign In
                    </Button>
                </form>

                <div className="mt-12 text-center lg:hidden">
                    <p className="text-sm text-slate-400 italic">
                        "The best coffee is the coffee you share."
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
