'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ImageLightboxProps {
    open: boolean;
    src: string | null;
    alt: string;
    onClose: () => void;
    width?: number;
    height?: number;
}

export function ImageLightbox({
    open,
    src,
    alt,
    onClose,
    width = 1200,
    height = 1800,
}: ImageLightboxProps) {
    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open || !src) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
        >
            <button
                type="button"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-colors hover:bg-black/60"
                onClick={onClose}
                aria-label="Close image preview"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="relative" onClick={(event) => event.stopPropagation()}>
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className="max-h-[92vh] w-auto max-w-[94vw] rounded-xl border border-white/15 object-contain shadow-2xl"
                    priority
                />
            </div>
        </div>
    );
}
