import { type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export function AuthField({ label, id, type = "text", placeholder, ...props }: AuthFieldProps) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="text-sm font-semibold text-slate-700 block ml-1"
            >
                {label}
            </label>
            <Input id={id} type={type} placeholder={placeholder} className="h-auto" {...props} />
        </div>
    );
}
