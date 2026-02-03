import { Bell } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

export function Header() {
    const { isCollapsed } = useSidebar();
    const sidebarWidth = isCollapsed ? 'left-20' : 'left-64';

    return (
        <header className={`fixed top-0 right-0 h-20 bg-[#F9F9F9] border-b border-[#EFEAE5] px-10 py-5 flex items-center justify-between z-30 transition-all duration-300 ${sidebarWidth}`}>
            <div className="flex flex-col items-start gap-1">

            </div>

            <div className="flex items-center gap-6">
                <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 text-[#707070] hover:bg-black/5 transition-colors">
                    <Bell size={20} />
                </button>

                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-[#707070]">Hi, Supplier</p>
                    <div
                        className="w-10 h-10 rounded-full bg-center bg-no-repeat bg-cover"
                        style={{
                            backgroundImage:
                                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxwbDyD4bBvVCuJaEUb2xlXzqhlBoh_VWXq_CcTNzDHVFdM43poWFPrmbWSUtDe-CbJC_EgCc3eIqv0v2pqk5NwKtcxkaIAX51yKL2rhrbBY0jor79_6wERvo59zxbzpas9D3lav_SjoB9rNoo-of_3v05-MKmx6pCW_hZnx58SsJE2L4tK_XOYL-cRxjijVNWKkMMB2WgDXq0IjA7dYDK-Uui5m4fF9koZs6PgdnDhGuLZx5YPH7ZCmeRqc3gX6jtwxjuNSkShN0")',
                        }}
                    />
                </div>
            </div>
        </header>
    );
}
