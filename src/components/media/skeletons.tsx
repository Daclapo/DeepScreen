'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function MediaCardSkeleton() {
    return (
        <div className="flex flex-col rounded-lg overflow-hidden bg-card border border-border/50">
            <Skeleton className="aspect-[2/3] w-full" />
            <div className="flex flex-col gap-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
    );
}

export function MediaGridSkeleton({ count = 10 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <MediaCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function HeroSkeleton() {
    return (
        <div className="relative h-[400px] w-full">
            <Skeleton className="absolute inset-0" />
        </div>
    );
}
