import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="64" height="64" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#2b3fae" />
        <rect x="11" y="26" width="7" height="12" rx="2" fill="#ffffff" />
        <rect x="20.5" y="19" width="7" height="19" rx="2" fill="#ffffff" />
        <rect x="30" y="12" width="7" height="26" rx="2" fill="#ffffff" />
        <path d="M14.5 8.5v8M10.5 12.5h8" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    size,
  );
}
