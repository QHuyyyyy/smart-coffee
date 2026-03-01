import { type ReactElement, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
    allowedRoles: string[];
    children: ReactElement;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const { token, currentUser, fetchCurrentUser } = useAuthStore();
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkAccess = async () => {
            if (!token) {
                if (isMounted) {
                    setHasAccess(false);
                    setCheckingAccess(false);
                }
                return;
            }

            if (currentUser) {
                if (isMounted) {
                    setHasAccess(allowedRoles.includes(currentUser.role));
                    setCheckingAccess(false);
                }
                return;
            }

            try {
                const user = await fetchCurrentUser();
                if (!isMounted) return;

                if (user && allowedRoles.includes(user.role)) {
                    setHasAccess(true);
                } else {
                    setHasAccess(false);
                }
            } finally {
                if (isMounted) {
                    setCheckingAccess(false);
                }
            }
        };

        void checkAccess();

        return () => {
            isMounted = false;
        };
    }, [token, currentUser, fetchCurrentUser, allowedRoles]);

    if (!token) {
        // Not logged in: redirect to login page
        return <Navigate to="/" replace />;
    }

    if (checkingAccess) {
        // Optionally render a loader here
        return null;
    }

    if (!hasAccess) {
        // Logged in but role is not allowed: redirect to login (or another page)
        return <Navigate to="/" replace />;
    }

    return children;
}
