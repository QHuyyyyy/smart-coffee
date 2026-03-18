import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
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

    const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

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
            const msg =
                err?.response?.data
                ?? "Registration failed";

            toast.error(msg);
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
            navigate("/supplier/dashboard");
        } catch (err: any) {
            toast.error(err.message || "OTP verification failed");
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);

        const otpArray = otp.split("");
        while (otpArray.length < 6) {
            otpArray.push("");
        }

        if (!digit) {
            otpArray[index] = "";
            setOtp(otpArray.join(""));
            return;
        }

        otpArray[index] = digit;
        const newOtp = otpArray.join("").slice(0, 6);
        setOtp(newOtp);

        if (digit && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace") {
            const otpArray = otp.split("");
            while (otpArray.length < 6) {
                otpArray.push("");
            }

            if (otpArray[index]) {
                otpArray[index] = "";
                setOtp(otpArray.join(""));
            } else if (index > 0) {
                otpInputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleResendOtp = async () => {
        try {
            await register({ email, password, phone });
            toast.success("A new OTP has been sent to your email");
        } catch (err: any) {
            toast.error(err.message || "Failed to resend OTP");
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

                        <div className="space-y-4">
                            <p className="text-center text-sm font-medium text-slate-800">Input your OTP</p>
                            <div className="flex justify-center gap-3">
                                {Array.from({ length: 6 }).map((_, index) => {
                                    const digit = otp[index] || "";
                                    return (
                                        <input
                                            key={index}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="w-10 h-14 sm:w-12 sm:h-16 rounded-full border border-[#c8a27a] text-center text-2xl text-[#4b2c20] bg-white focus:outline-none focus:border-[#4b2c20] focus:ring-2 focus:ring-[#e5d4c0]"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            ref={(el) => {
                                                otpInputRefs.current[index] = el;
                                            }}
                                            disabled={isLoading}
                                        />
                                    );
                                })}
                            </div>
                            <p className="text-center text-xs text-slate-500">
                                Didn't receive the code?{" "}
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-[#c39b7b] font-medium hover:underline"
                                >
                                    Resend
                                </button>
                            </p>
                        </div>

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
