import { type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

interface AuthFieldProps {
    label: string;
    id: string;
    type?: InputHTMLAttributes<HTMLInputElement>["type"];
    placeholder?: string;
}

export function AuthField({ label, id, type = "text", placeholder }: AuthFieldProps) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="text-sm font-semibold text-slate-700 block ml-1"
            >
                {label}
            </label>
            <Input id={id} type={type} placeholder={placeholder} className="h-auto" />
        </div>
    );
}
