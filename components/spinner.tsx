import {SVGProps} from "react";
import {cn} from "@/lib/cn";

export function Spinner(props: SVGProps<SVGSVGElement>) {
    const width = 5

    return <svg viewBox='0 0 50 50' role='progressbar' aria-label='Loading'
                fill='none'
                {...props}
                className={cn('text-blue-400 size-9', props.className)}
    >
        <circle cx='25' cy='25' r={25 - width} stroke='currentColor' strokeWidth={width} strokeLinecap='round'
                strokeDasharray={Math.PI * (54 - width) / 3}
                className='animate-spinner origin-center'
        />
    </svg>
}