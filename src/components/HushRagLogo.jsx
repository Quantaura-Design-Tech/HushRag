'use client';

import { cn } from '@/lib/utils';

const BRAND = {
  green: '#00A86B',
  darkGreen: '#004D3D',
  ink: '#071617',
};

/**
 * Inline HushRag logo.
 *
 * Variants:
 * - default: green hashtag mark + dark text
 * - mono: black mark + black text
 * - reversed: white mark + white text on dark-green rounded background
 * - icon: just the mark (default green)
 */
export default function HushRagLogo({
  variant = 'default',
  showText = true,
  className,
  ...props
}) {
  const isReversed = variant === 'reversed';
  const isMono = variant === 'mono';
  const isIcon = variant === 'icon';

  const barColor = isReversed || isMono ? BRAND.ink : BRAND.darkGreen;
  const verticalColor = isReversed || isMono ? BRAND.ink : BRAND.green;
  const textColor = isReversed ? '#ffffff' : BRAND.ink;

  if (isIcon) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        fill="none"
        className={cn('h-8 w-8', className)}
        aria-hidden="true"
        {...props}
      >
        <rect width="48" height="48" rx="10" fill={BRAND.darkGreen} />
        <rect x="6" y="12" width="36" height="9" rx="4.5" fill="#ffffff" />
        <rect x="6" y="25" width="36" height="9" rx="4.5" fill="#ffffff" />
        <rect x="10" y="7" width="9" height="34" rx="4.5" fill="#ffffff" />
        <rect x="27" y="7" width="9" height="34" rx="4.5" fill="#ffffff" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={isReversed ? '0 0 200 64' : '0 0 180 48'}
      fill="none"
      className={cn('h-8 w-auto', className)}
      aria-hidden="true"
      {...props}
    >
      {isReversed && <rect width="200" height="64" rx="12" fill={BRAND.darkGreen} />}
      <g>
        {/* Horizontal bars (back layer) */}
        <rect
          x={isReversed ? 16 : 4}
          y={isReversed ? 18 : 9}
          width={isReversed ? 36 : 40}
          height={isReversed ? 9 : 10}
          rx={isReversed ? 4.5 : 5}
          fill={barColor}
        />
        <rect
          x={isReversed ? 16 : 4}
          y={isReversed ? 35 : 25}
          width={isReversed ? 36 : 40}
          height={isReversed ? 9 : 10}
          rx={isReversed ? 4.5 : 5}
          fill={barColor}
        />
        {/* Vertical bars (front layer) */}
        <rect
          x={isReversed ? 20 : 9}
          y={isReversed ? 13 : 4}
          width={isReversed ? 9 : 10}
          height={isReversed ? 36 : 40}
          rx={isReversed ? 4.5 : 5}
          fill={verticalColor}
        />
        <rect
          x={isReversed ? 37 : 29}
          y={isReversed ? 13 : 4}
          width={isReversed ? 9 : 10}
          height={isReversed ? 36 : 40}
          rx={isReversed ? 4.5 : 5}
          fill={verticalColor}
        />
      </g>
      {showText && (
        <text
          x={isReversed ? 68 : 56}
          y={isReversed ? 42 : 34}
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          fontSize="28"
          fontWeight="800"
          fill={textColor}
          letterSpacing="-0.04em"
        >
          HushRag
        </text>
      )}
    </svg>
  );
}
