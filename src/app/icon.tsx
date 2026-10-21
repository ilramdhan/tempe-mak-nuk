import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Monogram "TMN" disederhanakan: tiga tiang + diagonal (lihat public/brand/favicon.svg). */
export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="5" fill="#2F4A2C" />
        <path
          fill="#FAF7F2"
          d="M4 8h2.4v16H4zM14.8 8h2.4v16h-2.4zM25.6 8H28v16h-2.4zM4 8h4.3L12 24H7.7zM14.8 8h4.3L28 24h-4.3z"
        />
      </svg>
    ),
    size,
  );
}
