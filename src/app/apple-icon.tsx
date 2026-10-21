import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <svg
      width="180"
      height="180"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" fill="#2F4A2C" />
      <g transform="translate(16 16) scale(0.8) translate(-16 -16)">
        <path
          fill="#FAF7F2"
          d="M4 8h2.4v16H4zM14.8 8h2.4v16h-2.4zM25.6 8H28v16h-2.4zM4 8h4.3L12 24H7.7zM14.8 8h4.3L28 24h-4.3z"
        />
      </g>
    </svg>,
    size,
  );
}
