import React from 'react';

interface LeafLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function LeafLogo({ size = 24, color = 'currentColor', ...props }: LeafLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Clean leaf outline shape without internal veins/dashes */}
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-13.9.2" />
      <path d="M9 22v-4" />
    </svg>
  );
}
