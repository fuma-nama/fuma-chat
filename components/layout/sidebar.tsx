import {ReactNode, useState} from "react";
import {cn} from "@/lib/cn";
import {buttonVariants} from "@/components/primitive";
import {SidebarIcon} from "lucide-react";

export function Sidebar({children}: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return <>
        <button
            aria-label="Trigger Sidebar"
            className={cn(buttonVariants({size: 'icon', className: 'fixed top-2 left-2 z-50 md:hidden'}))}
            onClick={() => setIsOpen(prev => !prev)}>
            <SidebarIcon className='size-4'/>
        </button>
        {isOpen &&
            <div className='fixed flex flex-col inset-0 bg-black/20 z-40 animate-overlay-in md:hidden'
                 onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
                <aside
                    className="relative flex flex-col h-full bg-neutral-800 p-4 overflow-auto max-w-[400px] pt-14 animate-popover-in">
                    {children}
                </aside>
            </div>}
        <aside
            className="flex flex-col border-r bg-neutral-800/50 border-neutral-700 p-4 w-[280px] relative overflow-auto max-md:hidden">
            {children}
        </aside>
    </>
}