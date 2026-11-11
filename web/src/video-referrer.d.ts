import 'react';

declare module 'react' {
  interface VideoHTMLAttributes<T> {
    /** video.twimg.com rejects playback when the request carries this site's Referer. */
    referrerPolicy?: React.HTMLAttributeReferrerPolicy | undefined;
  }
}
