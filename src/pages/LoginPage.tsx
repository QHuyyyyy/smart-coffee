import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../stores/auth.store"
import { toast } from "sonner";
export function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            await login({ email, password });
            navigate("/dashboard");
        } catch (err: Error | any) {
            toast.error("Login failed:", err);
        }
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
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <AuthField
                        id="email"
                        label="Email or Phone Number"
                        placeholder="Enter your email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block ml-1" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <AuthField
                                id="password"
                                label=""
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4b2c20] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[22px]">
                                    {showPassword ? "visibility" : "visibility_off"}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm py-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
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
                        disabled={isLoading}
                        className="w-full font-bold active:scale-[0.99] mt-4"
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
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
