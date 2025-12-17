'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  color?: string;
  height?: number;
}

/**
 * ORBITA logo - clean SVG recreation
 * Vertical line followed by "ORBITA" text in bold sans-serif
 * Color is adjustable via className (text-*) or color prop
 */
export function Logo({ className, color, height = 24 }: LogoProps) {
  // Proportions based on the original: roughly 6:1 width to height ratio for full logo
  const width = height * 5;
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-neutral-800', className)}
      style={color ? { color } : undefined}
    >
      {/* Vertical line */}
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* ORBITA text - using a clean sans-serif style path */}
      <text
        x="14"
        y="17.5"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="700"
        fontSize="16"
        letterSpacing="0.5"
      >
        ORBITA
      </text>
    </svg>
  );
}

/**
 * Compact version - just the vertical line mark
 */
export function LogoMark({ className, color, height = 24 }: LogoProps) {
  return (
    <svg
      width={height * 0.3}
      height={height}
      viewBox="0 0 8 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-neutral-800', className)}
      style={color ? { color } : undefined}
    >
      <line
        x1="4"
        y1="2"
        x2="4"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
