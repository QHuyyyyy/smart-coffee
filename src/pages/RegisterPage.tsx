import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../stores/auth.store"
import { toast } from "sonner";

type RegistrationStep = "register" | "otp";

export function RegisterPage() {
    const navigate = useNavigate();
    const { register, verifyOtp, isLoading, error } = useAuthStore();

    // Registration form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // OTP form state
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<RegistrationStep>("register");

    // Validation function
    const validateRegisterForm = (): boolean => {
        if (!email.trim()) {
            toast.error("Please enter your email");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email");
            return false;
        }
        if (!password) {
            toast.error("Please enter a password");
            return false;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return false;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return false;
        }
        if (!phone.trim()) {
            toast.error("Please enter your phone number");
            return false;
        }
        return true;
    };

    const validateOtpForm = (): boolean => {
        if (!otp.trim()) {
            toast.error("Please enter the OTP");
            return false;
        }
        if (otp.length < 4) {
            toast.error("OTP must be at least 4 characters");
            return false;
        }
        return true;
    };

    const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validateRegisterForm()) {
            return;
        }

        try {
            await register({ email, password, phone });
            setStep("otp");
            toast.success("Registration successful! Please verify your email with OTP");
        } catch (err: any) {
            toast.error(err.message || "Registration failed");
        }
    };

    const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validateOtpForm()) {
            return;
        }
        let role = "Supplier";
        try {
            await verifyOtp({ email, otp, role });
            toast.success("Email verified successfully!");
            navigate("/dashboard");
        } catch (err: any) {
            toast.error(err.message || "OTP verification failed");
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
                    title="Create your account"
                    subtitle="Join us to start your coffee journey."
                />

                <AuthTabs active="signup" />

                {step === "register" ? (
                    // Registration Form
                    <form className="space-y-6" onSubmit={handleRegisterSubmit}>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <AuthField
                            id="email"
                            label="Email Address"
                            placeholder="Enter your email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />

                        <AuthField
                            id="phone"
                            label="Phone Number"
                            placeholder="Enter your phone number"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={isLoading}
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
                                    disabled={isLoading}
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

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 block ml-1" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <AuthField
                                    id="confirmPassword"
                                    label=""
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4b2c20] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[22px]">
                                        {showConfirmPassword ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#4b2c20] hover:bg-[#3a2119] text-white py-3 rounded-xl font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>

                        <div className="text-center text-sm text-slate-600">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="text-[#4b2c20] hover:underline font-semibold transition-colors"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                ) : (
                    // OTP Verification Form
                    <form className="space-y-6" onSubmit={handleOtpSubmit}>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="text-center mb-6">
                            <p className="text-slate-600 text-sm">
                                We've sent a verification code to <strong>{email}</strong>
                            </p>
                        </div>

                        <AuthField
                            id="otp"
                            label="Verification Code"
                            placeholder="Enter 4-digit code"
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            disabled={isLoading}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-[#4b2c20] hover:bg-[#3a2119] text-white py-3 rounded-xl font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? "Verifying..." : "Verify Code"}
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep("register")}
                                className="text-[#4b2c20] hover:underline font-semibold transition-colors text-sm"
                            >
                                Back to registration
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                    By creating an account, you agree to our{" "}
                    <button className="text-[#4b2c20] hover:underline">Terms of Service</button>
                    {" "}and{" "}
                    <button className="text-[#4b2c20] hover:underline">Privacy Policy</button>
                </div>
            </div>
        </AuthLayout>
    );
}
