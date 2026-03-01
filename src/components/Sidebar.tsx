import { ChevronLeft, Home, ShoppingCart, Truck, CreditCard, Package, Settings, Coffee } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { authService } from '../apis/auth.service';
import { toast } from 'sonner';
export function Sidebar() {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();
    const menuItems = [
        { icon: Home, label: 'Home', href: '/dashboard' },
        { icon: Coffee, label: 'Recipes', href: '/recipes' },
        { icon: Coffee, label: 'Coffee Shop', href: '/coffee-shop' },
        { icon: ShoppingCart, label: 'Orders', href: '/orders' },
        { icon: Truck, label: 'Shipping', href: '/shipping' },
        { icon: CreditCard, label: 'Payment', href: '/payment' },
        { icon: Package, label: 'Inventory', href: '/inventory' },
    ];

    const isActive = (href: string) => {
        return location.pathname === href;
    };
    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate("/");
            toast.success("Logged out successfully");
        } catch (err: Error | any) {
            toast.error(err?.message || "Logout failed");
        }
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-[#EFEAE5] border-r border-[#E0D5D0] transition-all duration-300 ease-in-out z-40 ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E0D5D0] h-20">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#4b2c20] text-3xl">coffee</span>
                        <span className="text-2xl font-bold text-[#4b2c20] tracking-tight">SmartCoffee</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="ml-auto p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                >
                    <ChevronLeft
                        size={20}
                        className={`text-[#573E32] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''
                            }`}
                    />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 p-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`flex  gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isCollapsed ? 'lg:justify-center items-center' : ''
                                } ${active
                                    ? 'bg-[#573E32] text-white'
                                    : 'text-[#573E32] hover:bg-black/5'
                                }`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon size={20} className="flex-shrink-0" />
                            {!isCollapsed && (
                                <span className="text-sm font-medium leading-normal">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-4 left-4 right-4 border-t border-[#E0D5D0] pt-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[#573E32] hover:bg-black/5"
                    title={isCollapsed ? 'Logout' : ''}
                >
                    <Settings size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="text-sm font-medium leading-normal">Logout</span>
                    )}
                </button>
            </div>
        </aside>
    );
}
