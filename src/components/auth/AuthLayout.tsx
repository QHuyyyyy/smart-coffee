import type { ReactNode } from "react";
import bannerImage from "../../assets/banner.png"
interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="font-display bg-[#faf7f5] text-slate-900 min-h-screen flex items-center justify-center p-4 md:p-12">
            <div className="w-full max-w-7xl bg-white rounded-[40px] overflow-hidden flex flex-col lg:flex-row shadow-[0_10px_40px_-10px_rgba(75,44,32,0.15),0_8px_20px_-12px_rgba(75,44,32,0.1)]">
                {/* Left image */}
                <div className="w-full lg:w-[55%] p-4 lg:p-6 bg-[#fdf8f4]/30">
                    <div className="relative h-full w-full rounded-[32px] overflow-hidden aspect-[16/10] lg:aspect-auto">
                        <img
                            alt="Atmospheric shot of a steaming coffee cup on a wooden table in a sunlit cafe"
                            className="absolute inset-0 w-full h-full object-cover"
                            src={bannerImage}
                        />
                        <div className="absolute inset-0 bg-[#4b2c20]/5" />
                        <div className="absolute bottom-8 left-8 hidden lg:block">
                        </div>
                    </div>
                </div>

                {/* Right side content (form, etc.) */}
                <div className="w-full lg:w-[45%] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
