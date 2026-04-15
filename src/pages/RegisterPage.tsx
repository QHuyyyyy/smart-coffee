import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../stores/auth.store"
import { toast } from "sonner";

type RegistrationStep = "register" | "otp";

const registerSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z.string().trim().regex(
        /^(?:\+84|84|0)\d{9,10}$/,
        "Invalid phone number"
    ),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const otpSchema = z.object({
    otp: z.string().trim().min(4, "OTP must be at least 4 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export function RegisterPage() {
    const navigate = useNavigate();
    const { register, verifyOtp, isLoading, error } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // OTP form state
    const [step, setStep] = useState<RegistrationStep>("register");

    const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const registerForm = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            phone: "",
        },
    });

    const otpForm = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
        },
    });

    const handleRegisterSubmit = async (values: RegisterFormValues) => {

        try {
            await register({
                email: values.email.trim(),
                password: values.password,
                phone: values.phone.trim().replace(/^(?:\+84|84)/, "0"),
            });
            setStep("otp");
            toast.success("Registration successful! Please verify your email with OTP to complete the process.");
        } catch (err: any) {
            const msg =
                err?.response?.data
                ?? "Registration failed";

            toast.error(msg);
        }
    };

    const handleOtpSubmit = async (values: OtpFormValues) => {
        let role = "Supplier";
        try {
            await verifyOtp({ email: registerForm.getValues("email").trim(), otp: values.otp.trim(), role });
            toast.success("Email verified successfully!");
            navigate("/");
        } catch (err: any) {
            toast.error(err.message || "OTP verification failed");
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);

        const currentOtp = otpForm.getValues("otp") ?? "";
        const otpArray = currentOtp.split("");
        while (otpArray.length < 6) {
            otpArray.push("");
        }

        if (!digit) {
            otpArray[index] = "";
            otpForm.setValue("otp", otpArray.join(""), { shouldDirty: true, shouldValidate: true });
            return;
        }

        otpArray[index] = digit;
        const newOtp = otpArray.join("").slice(0, 6);
        otpForm.setValue("otp", newOtp, { shouldDirty: true, shouldValidate: true });

        if (digit && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace") {
            const currentOtp = otpForm.getValues("otp") ?? "";
            const otpArray = currentOtp.split("");
            while (otpArray.length < 6) {
                otpArray.push("");
            }

            if (otpArray[index]) {
                otpArray[index] = "";
                otpForm.setValue("otp", otpArray.join(""), { shouldDirty: true, shouldValidate: true });
            } else if (index > 0) {
                otpInputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleResendOtp = async () => {
        try {
            const values = registerForm.getValues();
            await register({
                email: values.email.trim(),
                password: values.password,
                phone: values.phone.trim().replace(/^(?:\+84|84)/, "0"),
            });
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
                    <form className="space-y-6" onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}>
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
                            {...registerForm.register("email")}
                            disabled={isLoading}
                        />
                        {registerForm.formState.errors.email && (
                            <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
                        )}

                        <AuthField
                            id="phone"
                            label="Phone Number"
                            placeholder="Enter your phone number"
                            type="tel"
                            {...registerForm.register("phone")}
                            disabled={isLoading}
                        />
                        {registerForm.formState.errors.phone && (
                            <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.phone.message}</p>
                        )}

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
                                    {...registerForm.register("password")}
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
                            {registerForm.formState.errors.password && (
                                <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
                            )}
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
                                    {...registerForm.register("confirmPassword")}
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
                            {registerForm.formState.errors.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                            )}
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
                    <form className="space-y-6" onSubmit={otpForm.handleSubmit(handleOtpSubmit)}>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="text-center mb-6">
                            <p className="text-slate-600 text-sm">
                                We've sent a verification code to <strong>{registerForm.watch("email")}</strong>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-center text-sm font-medium text-slate-800">Input your OTP</p>
                            <div className="flex justify-center gap-3">
                                {Array.from({ length: 6 }).map((_, index) => {
                                    const digit = (otpForm.watch("otp") ?? "")[index] || "";
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
                            {otpForm.formState.errors.otp && (
                                <p className="text-center text-xs text-red-500">{otpForm.formState.errors.otp.message}</p>
                            )}
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
