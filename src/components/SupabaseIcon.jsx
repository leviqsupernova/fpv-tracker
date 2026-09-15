import React, { useId } from "react";

/** A simplified rendition of the Supabase bolt mark — kept in the
 *  brand's own green regardless of the active theme, same convention
 *  as any other third-party service badge. */
export function SupabaseIcon({ size = 16, className }) {
  const gradId = `supabase-icon-grad-${useId()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.6 22.3c-.6.7-1.7.3-1.7-.6v-8.2H4.7c-1.3 0-2-1.6-1.1-2.6L10.4 1.7c.6-.7 1.7-.3 1.7.6v8.2h7.2c1.3 0 2 1.6 1.1 2.6l-7.8 9.2Z"
        fill="#3ECF8E"
      />
      <path
        d="M13.6 22.3c-.6.7-1.7.3-1.7-.6v-8.2H4.7c-1.3 0-2-1.6-1.1-2.6L10.4 1.7c.6-.7 1.7-.3 1.7.6v8.2h7.2c1.3 0 2 1.6 1.1 2.6l-7.8 9.2Z"
        fillOpacity="0.2"
        fill={`url(#${gradId})`}
      />
      <defs>
        <linearGradient id={gradId} x1="3.3" y1="2" x2="15.4" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#249361" />
          <stop offset="1" stopColor="#3ECF8E" />
        </linearGradient>
      </defs>
    </svg>
  );
}
