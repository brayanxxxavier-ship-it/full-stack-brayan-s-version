/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/// <reference types="vite/client" />

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          'auto-rotate'?: boolean;
          'rotation-per-second'?: string;
          'disable-zoom'?: boolean;
          'disable-pan'?: boolean;
          'disable-tap'?: boolean;
          ar?: boolean;
          'camera-controls'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}