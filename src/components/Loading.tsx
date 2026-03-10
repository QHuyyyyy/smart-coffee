import React from 'react';
import LoadingImage from '../assets/loading.png';
/**
 * Full-screen loading view for the web app.
 * Uses /loading.png from the public folder.
 */
export function Loading() {
    const messages = [
        'Web is loading your results.',
        'Please be patient while we finish.',
    ];

    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md px-6 py-7 ">
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center">
                        <img
                            src={LoadingImage}
                            alt="Loading"
                            className="h-56 w-56 animate-pulse object-contain"
                        />
                    </div>

                    <div className="mt-5 flex h-14 items-center justify-center overflow-hidden">
                        <p className="text-center text-base font-medium text-[#4B2E1E]">
                            {messages[index]}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function InlineLoading({ text = "Loading...", textClassName }: { text?: string; textClassName?: string }) {
    return (
        <div className="inline-flex items-center gap-2 text-[#4B2E1E]">
            <img
                src={LoadingImage}
                alt="Loading"
                className="h-8 w-8 animate-pulse object-contain"
            />
            <span className={`text-sm font-medium ${textClassName ?? "text-[#4B2E1E]"}`}>
                {text}
            </span>
        </div>
    );
}
