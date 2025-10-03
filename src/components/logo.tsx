import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="2"
        y="3"
        width="20"
        height="18"
        rx="3"
        className="stroke-primary"
        strokeWidth="1.5"
      />
      <path
        d="M7 12H17"
        className="stroke-primary"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 8H12"
        className="stroke-primary"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
       <path
        d="M7 16H14"
        className="stroke-primary"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
