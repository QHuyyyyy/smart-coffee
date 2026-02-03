interface AuthHeaderProps {
    title: string;
    subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
    return (
        <div className="mb-10">
            <h1 className="text-3xl font-bold mb-3 font-serif">{title}</h1>
            {subtitle && <p className="text-slate-500 text-base">{subtitle}</p>}
        </div>
    );
}
