import Image from 'next/image';

interface CountryFlagProps {
    countryCode: string;
    className?: string;
    title?: string;
}

export function CountryFlag({ countryCode, className = '', title }: CountryFlagProps) {
    if (!countryCode) return null;
    const code = countryCode.toLowerCase();

    return (
        <img
            src={`https://flagcdn.com/w40/${code}.png`}
            srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
            width="24"
            height="16"
            alt={countryCode}
            title={title || countryCode}
            className={`inline-block object-cover border border-border/30 ${className}`}
            style={{ aspectRatio: '3/2' }}
            loading="lazy"
        />
    );
}
