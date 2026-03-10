import { useEffect, useMemo, useRef, useState } from "react";
import { UserCircle2, Bell, ShieldCheck, Star, Camera } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineLoading } from "@/components/Loading";
import { authService } from "@/apis/auth.service";

type ActiveTab = "profile" | "notifications";

export function SupplierProfile() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

    const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [mailingAddress, setMailingAddress] = useState("");
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setIsLoadingUser(true);
            void fetchCurrentUser().finally(() => {
                setIsLoadingUser(false);
            });
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        setFullName(currentUser.supplierName ?? "");
        setEmail(currentUser.email ?? "");
        setPhone(currentUser.phone ?? "");
        setMailingAddress(currentUser.address ?? "");
    }, [currentUser]);

    const initials = useMemo(() => {
        const source = (currentUser?.supplierName || currentUser?.email || "").trim();
        if (!source) return "?";
        const parts = source.split(/\s+/);
        if (parts.length === 1) {
            return parts[0][0]?.toUpperCase() ?? "?";
        }
        return `${parts[0][0]?.toUpperCase() ?? ""}${parts[1][0]?.toUpperCase() ?? ""}` || "?";
    }, [currentUser?.supplierName, currentUser?.email]);

    const handleSaveProfile = async () => {
        if (!currentUser) return;

        const trimmedName = fullName.trim();
        const trimmedPhone = phone.trim();
        const trimmedAddress = mailingAddress.trim();

        if (!trimmedName || !trimmedAddress) {
            setProfileError("Full name and mailing address are required.");
            setProfileSuccess(null);
            return;
        }

        const requests: Promise<unknown>[] = [];

        if (trimmedPhone !== (currentUser.phone ?? "")) {
            requests.push(authService.updateProfile({ phone: trimmedPhone || undefined }));
        }

        if (
            trimmedName !== (currentUser.supplierName ?? "") ||
            trimmedAddress !== (currentUser.address ?? "")
        ) {
            requests.push(
                authService.updateSupplier({
                    accountId: currentUser.accountId,
                    supplierId: currentUser.supplierId ?? undefined,
                    supplierName: trimmedName,
                    address: trimmedAddress,
                }),
            );
        }

        if (requests.length === 0) {
            setProfileError(null);
            setProfileSuccess("No changes to save.");
            return;
        }

        try {
            setIsSavingProfile(true);
            setProfileError(null);
            setProfileSuccess(null);
            await Promise.all(requests);
            await fetchCurrentUser();
            setProfileSuccess("Profile updated successfully.");
        } catch (err: any) {
            const message =
                err?.response?.data?.message ?? err?.message ?? "Failed to update profile. Please try again.";
            setProfileError(message);
            setProfileSuccess(null);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleAvatarClick = () => {
        setAvatarError(null);
        fileInputRef.current?.click();
    };

    const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError(null);

        if (!file.type.startsWith("image/")) {
            setAvatarError("Please select an image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setAvatarError("Image must be smaller than 5MB.");
            return;
        }

        try {
            setIsUploadingAvatar(true);
            await authService.uploadSupplierImage(file);
            await fetchCurrentUser();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ?? err?.message ?? "Failed to upload avatar. Please try again.";
            setAvatarError(message);
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = "";
        }
    };

    const handleChangePassword = async () => {
        setPasswordError(null);
        setPasswordSuccess(null);

        if (!currentPassword.trim() || !newPassword.trim()) {
            setPasswordError("Current password and new password are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        try {
            setIsChangingPassword(true);
            await authService.changePassword({
                oldPassword: currentPassword,
                newPassword,
            });
            setPasswordSuccess("Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            const message =
                err?.response?.data?.message ?? err?.message ?? "Failed to change password. Please try again.";
            setPasswordError(message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoadingUser) {
        return (
            <div className="mt-24 px-10 pb-10 w-full overflow-y-auto flex items-center justify-center">
                <InlineLoading text="Loading profile..." />
            </div>
        );
    }

    if (!currentUser || currentUser.role !== "Supplier") {
        return (
            <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
                <p className="text-sm text-red-500">
                    You must be logged in as a supplier to view this page.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full space-y-8">
                {/* Header card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                className="h-16 w-16 rounded-full bg-linear-to-br from-[#FEE4D6] to-[#F9D5B5] flex items-center justify-center text-2xl font-semibold text-[#4b2c20] overflow-hidden border border-[#E6D5C6] focus:outline-none focus:ring-2 focus:ring-[#F47A1F] focus:ring-offset-2"
                            >
                                {currentUser.image ? (
                                    <img
                                        src={currentUser.image}
                                        alt={currentUser.supplierName ?? currentUser.email}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{initials}</span>
                                )}
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-xs text-white">
                                        Uploading...
                                    </div>
                                )}
                            </button>
                            <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white shadow-sm border border-[#E6D5C6] flex items-center justify-center text-[#4b2c20]">
                                <Camera size={14} onClick={handleAvatarClick} />
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-semibold text-[#1F1F1F] flex items-center gap-2">
                                {currentUser.supplierName || "Supplier"}
                            </h1>
                            <p className="text-sm text-[#7A6A5C]">
                                Premium coffee supplier • SmartCoffee Partner
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 self-start md:self-auto">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-full border-[#E6D5C6] text-[#4b2c20] px-5 py-2 h-auto text-sm"
                        >
                            View Public Profile
                        </Button>
                    </div>
                </div>
                {avatarError && (
                    <p className="text-xs text-red-600 mt-1">{avatarError}</p>
                )}

                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-[#EFEAE5] text-sm">
                    <div className="flex gap-8">
                        <button
                            type="button"
                            className={`pb-3 inline-flex items-center gap-2 border-b-2 text-sm font-medium transition-colors ${activeTab === "profile"
                                ? "border-[#4b2c20] text-[#4b2c20]"
                                : "border-transparent text-[#9A8C80] hover:text-[#4b2c20]"
                                }`}
                            onClick={() => setActiveTab("profile")}
                        >
                            <UserCircle2 size={18} />
                            <span>Account Profile</span>
                        </button>
                        <button
                            type="button"
                            className={`pb-3 inline-flex items-center gap-2 border-b-2 text-sm font-medium transition-colors ${activeTab === "notifications"
                                ? "border-[#4b2c20] text-[#4b2c20]"
                                : "border-transparent text-[#9A8C80] hover:text-[#4b2c20]"
                                }`}
                            onClick={() => setActiveTab("notifications")}
                        >
                            <Bell size={18} />
                            <span>Notifications</span>
                        </button>
                    </div>
                </div>

                {activeTab === "profile" ? (
                    <div className="space-y-8">
                        {/* Personal Information */}
                        <section className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-6 space-y-6">
                            <div>
                                <h2 className="text-base font-semibold text-[#1F1F1F]">Personal Information</h2>
                                <p className="mt-1 text-sm text-[#8C7A6B]">
                                    Manage your basic contact details and identity.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#4F4F4F]">Full Name</label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. Johnathan Miller"
                                        className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#4F4F4F]">Email Address</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="h-11 rounded-xl border-[#E6D5C6] bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#4F4F4F]">Phone Number</label>
                                    <Input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                        className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#4F4F4F]">Your Rating</label>
                                    <div className="h-11 rounded-xl px-4 flex items-center text-sm text-[#4b2c20]">
                                        {currentUser.rating != null ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            size={16}
                                                            className={
                                                                star <= Math.round(currentUser.rating ?? 0)
                                                                    ? "fill-[#F59E0B] text-[#F59E0B]"
                                                                    : "text-[#E5E7EB]"
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-[#6B7280]">
                                                    {currentUser.rating.toFixed(1)} / 5.0
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[#9CA3AF]">Not rated yet</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Mailing Address</label>
                                <textarea
                                    value={mailingAddress}
                                    onChange={(e) => setMailingAddress(e.target.value)}
                                    placeholder="Block 7, Industrial Zone South, Addis Ababa, Ethiopia"
                                    className="min-h-24 w-full resize-none rounded-xl border border-[#E6D5C6] bg-white/80 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#F47A1F] focus-visible:ring-offset-0"
                                />
                            </div>

                            {profileError && (
                                <p className="text-xs text-red-600">{profileError}</p>
                            )}
                            {profileSuccess && !profileError && (
                                <p className="text-xs text-emerald-600">{profileSuccess}</p>
                            )}

                            <div className="flex items-center justify-end pt-2">
                                <Button
                                    type="button"
                                    variant="coffee"
                                    size="lg"
                                    className="rounded-full px-8"
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                >
                                    {isSavingProfile ? (
                                        <InlineLoading text="Saving changes..." textClassName="text-white" />
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </section>

                        {/* Security */}
                        <section className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-[#FEE4D6] flex items-center justify-center text-[#4b2c20]">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-[#1F1F1F]">Security</h2>
                                    <p className="mt-1 text-sm text-[#8C7A6B]">
                                        Update your password to keep your account secure.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 max-w-xl">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#4F4F4F]">Current Password</label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#4F4F4F]">New Password</label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#4F4F4F]">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                    />
                                </div>
                            </div>

                            {passwordError && (
                                <p className="text-xs text-red-600">{passwordError}</p>
                            )}
                            {passwordSuccess && !passwordError && (
                                <p className="text-xs text-emerald-600">{passwordSuccess}</p>
                            )}

                            <div className="flex items-center justify-end pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="rounded-full px-8 border-[#E6D5C6] text-[#4b2c20]"
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword}
                                >
                                    {isChangingPassword ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </section>
                    </div>
                ) : (
                    <section className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#FEE4D6] flex items-center justify-center text-[#4b2c20]">
                                <Bell size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-[#1F1F1F]">Notifications</h2>
                                <p className="mt-1 text-sm text-[#8C7A6B]">
                                    Configure email and in-app notifications for supplier activity.
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-[#8C7A6B]">
                            Notification preferences will be available in a future update.
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
}
