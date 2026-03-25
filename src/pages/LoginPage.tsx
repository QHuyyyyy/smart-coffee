import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { InlineLoading } from "@/components/Loading";
import { useAuthStore } from "../stores/auth.store";
import { toast } from "sonner";
export function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, fetchCurrentUser, logout } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            await login({ email, password });
            const user = await fetchCurrentUser();

            if (user?.role === "Admin") {
                navigate("/admin/dashboard");
            } else if (user?.role === "Supplier") {
                navigate("/supplier/dashboard");
            } else {
                toast.error("Tài khoản không có quyền truy cập ứng dụng này.");
                logout();
            }
        } catch (err: Error | any) {
            toast.error(err?.response?.data || "Login failed. Please check your credentials.");
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

                    <div className="flex items-end justify-between text-sm py-2">

                        <button
                            type="button"
                            className="text-[#4b2c20] hover:underline font-semibold transition-colors"
                            onClick={() => navigate("/forgot-password")}
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
                        {isLoading ? (
                            <InlineLoading text="Signing In..." textClassName="text-white" />
                        ) : (
                            "Sign In"
                        )}
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
