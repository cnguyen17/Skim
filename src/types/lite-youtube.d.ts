// Ambient types for the <lite-youtube> custom element (lite-youtube-embed).
// React 19 keeps JSX under the React namespace, so we augment React.JSX.
import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "lite-youtube": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        videoid: string;
        playlabel?: string;
        params?: string;
        /** enable the YT JS API ("1" mounts the iframe with the API) */
        "js-api"?: string;
      };
    }
  }
}
