import { useNavigate } from "react-router-dom";

interface AuthTabsProps {
    active: "signin" | "signup";
}

export function AuthTabs({ active }: AuthTabsProps) {
    const navigate = useNavigate();

    return (
        <div className="bg-[#fdf8f4] p-1 rounded-2xl flex mb-10">
            <button
                onClick={() => navigate("/")}
                className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${active === "signin"
                    ? "bg-[#4b2c20] text-white shadow-md"
                    : "text-[#4b2c20] hover:bg-slate-200/50"
                    }`}
            >
                Sign In
            </button>
            <button
                onClick={() => navigate("/register")}
                className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${active === "signup"
                    ? "bg-[#4b2c20] text-white shadow-md"
                    : "text-[#4b2c20] hover:bg-slate-200/50"
                    }`}
            >
                Sign Up
            </button>
        </div>
    );
}
