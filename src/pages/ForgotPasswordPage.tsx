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
import { authService } from "@/apis/auth.service";
import { toast } from "sonner";

type ForgotStep = "request" | "otp" | "reset";

const requestSchema = z.object({
    email: z.string().trim().min(1, "Please enter your email").email("Please enter a valid email"),
});

const otpSchema = z.object({
    otp: z.string().trim().min(4, "OTP must be at least 4 characters"),
});

const resetSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type RequestFormValues = z.infer<typeof requestSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [step, setStep] = useState<ForgotStep>("request");
    const [isLoading, setIsLoading] = useState(false);

    const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const requestForm = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            email: "",
        },
    });

    const otpForm = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
        },
    });

    const resetForm = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    const handleRequestSubmit = async (values: RequestFormValues) => {

        try {
            setIsLoading(true);
            await authService.forgotPassword({ email: values.email.trim() });
            toast.success("OTP has been sent to your email");
            setStep("otp");
        } catch (err: any) {
            toast.error(err.message || "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtpSubmit = async (values: OtpFormValues) => {

        try {
            setIsLoading(true);
            await authService.verifyForgotPasswordOtp({
                email: requestForm.getValues("email").trim(),
                otp: values.otp.trim(),
            });
            toast.success("OTP verified successfully");
            setStep("reset");
        } catch (err: any) {
            toast.error(err.message || "OTP verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPasswordSubmit = async (values: ResetFormValues) => {

        try {
            setIsLoading(true);
            await authService.resetPassword({
                email: requestForm.getValues("email").trim(),
                otp: otpForm.getValues("otp").trim(),
                newPassword: values.newPassword,
            });
            toast.success("Password has been reset successfully");
            navigate("/");
        } catch (err: any) {
            toast.error(err.message || "Password reset failed");
        } finally {
            setIsLoading(false);
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
        const valid = await requestForm.trigger("email");
        if (!valid) {
            const emailMessage = requestForm.formState.errors.email?.message;
            if (emailMessage) {
                toast.error(emailMessage);
            }
            return;
        }

        try {
            setIsLoading(true);
            await authService.forgotPassword({ email: requestForm.getValues("email").trim() });
            toast.success("A new OTP has been sent to your email");
        } catch (err: any) {
            toast.error(err.message || "Failed to resend OTP");
        } finally {
            setIsLoading(false);
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
                    title="Forgot your password?"
                    subtitle="Don't worry, we'll help you reset it."
                />

                <AuthTabs active="signin" />

                {step === "request" && (
                    <form className="space-y-6" onSubmit={requestForm.handleSubmit(handleRequestSubmit)}>
                        <p className="text-sm text-slate-600">
                            Enter the email associated with your account and we'll send you a code to reset your password.
                        </p>

                        <AuthField
                            id="email"
                            label="Email"
                            placeholder="Enter your email"
                            type="email"
                            {...requestForm.register("email")}
                        />
                        {requestForm.formState.errors.email && (
                            <p className="text-xs text-red-500 mt-1">{requestForm.formState.errors.email.message}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-[#4b2c20] hover:bg-[#3a2119] text-white py-3 rounded-xl font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending code..." : "Send reset code"}
                        </Button>
                    </form>
                )}

                {step === "otp" && (
                    <form className="space-y-6" onSubmit={otpForm.handleSubmit(handleVerifyOtpSubmit)}>
                        <div className="text-center mb-6">
                            <p className="text-slate-600 text-sm">
                                We've sent a verification code to <strong>{requestForm.watch("email")}</strong>
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
                    </form>
                )}

                {step === "reset" && (
                    <form className="space-y-6" onSubmit={resetForm.handleSubmit(handleResetPasswordSubmit)}>
                        <p className="text-sm text-slate-600">
                            Enter your new password below. Make sure it's something secure and that you remember it.
                        </p>

                        <AuthField
                            id="newPassword"
                            label="New Password"
                            placeholder="Enter new password"
                            type="password"
                            {...resetForm.register("newPassword")}
                        />
                        {resetForm.formState.errors.newPassword && (
                            <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.newPassword.message}</p>
                        )}

                        <AuthField
                            id="confirmPassword"
                            label="Confirm New Password"
                            placeholder="Confirm new password"
                            type="password"
                            {...resetForm.register("confirmPassword")}
                        />
                        {resetForm.formState.errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.confirmPassword.message}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-[#4b2c20] hover:bg-[#3a2119] text-white py-3 rounded-xl font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? "Resetting password..." : "Reset Password"}
                        </Button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                    Remember your password?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-[#4b2c20] hover:underline font-semibold"
                    >
                        Back to sign in
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}
