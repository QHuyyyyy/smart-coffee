import { ChevronLeft, Home, ShoppingCart, Truck, CreditCard, Package, Settings, Coffee } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export function Sidebar() {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const location = useLocation();

    const menuItems = [
        { icon: Home, label: 'Home', href: '/dashboard' },
        { icon: Coffee, label: 'Recipes', href: '/recipes' },
        { icon: ShoppingCart, label: 'Orders', href: '/orders' },
        { icon: Truck, label: 'Shipping', href: '/shipping' },
        { icon: CreditCard, label: 'Payment', href: '/payment' },
        { icon: Package, label: 'Inventory', href: '/inventory' },
    ];

    const isActive = (href: string) => {
        return location.pathname === href;
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-[#EFEAE5] border-r border-[#E0D5D0] transition-all duration-300 ease-in-out z-40 ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#E0D5D0] h-20">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full bg-center bg-no-repeat bg-cover flex-shrink-0"
                            style={{
                                backgroundImage:
                                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAvK60x1CZwyJP76b6CTyDK85FEcicxzqJ44NFpsuQQEzPnpx6Yxn5APQmIFZi48Siyh9DWdRA9pU0rWEjcUlkUqJq0F6I3xalEq5DXktOu_nNqMtWFid1gg8L3Fu12vpCO5lCZ_heHI6r73VOn01WjqKlikv2J6Ne5xpFUzHX4Z1KT6eM9EaxOu4R-EKDABNJJmUCvUC4by9M2gzZ7HUVMvfrLN88yKGRi_LrClDG8takTyJeA4w6e9Va49hoVeEZFHeFjPKEPws0")',
                            }}
                        />
                        <h1 className="text-lg font-bold text-[#573E32] whitespace-nowrap">SmartCoffee</h1>
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
                <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-[#573E32] hover:bg-black/5"
                    title={isCollapsed ? 'Logout' : ''}
                >
                    <Settings size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="text-sm font-medium leading-normal">Logout</span>
                    )}
                </Link>
            </div>
        </aside>
    );
}
