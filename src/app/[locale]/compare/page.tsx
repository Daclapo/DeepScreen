'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeftRight } from 'lucide-react';

export default function ComparePage() {
    const t = useTranslations('compare');

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

            {/* Placeholder for Phase 6 */}
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border rounded-lg">
                <ArrowLeftRight className="h-12 w-12 mb-4 opacity-40" />
                <p className="text-lg font-medium">{t('selectTwo')}</p>
                <p className="text-sm mt-1 max-w-sm text-center">
                    This feature is coming soon. You will be able to compare two movies or two series side by side.
                </p>
            </div>
        </div>
    );
}
