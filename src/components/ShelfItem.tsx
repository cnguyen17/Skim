// src/components/ShelfItem.tsx
// One item on a fridge shelf. Collapsed = a lazy thumbnail button; expanded =
// the real player mounted inline (lite-youtube for video, SpotifyEmbed for
// audio). Expansion is controlled by WorkFridge via activeKey so only ONE item
// is ever expanded — i.e. never more than one real iframe mounted at a time (§9).
//
// TODO(motion previews): thumbnails are static stills. Animated hover previews
// would require self-hosted muted clips (YouTube gives no GIF) — out of scope.

import "lite-youtube-embed";
import "lite-youtube-embed/src/lite-yt-embed.css";
import { useState } from "react";
import { SpotifyEmbed } from "./SpotifyEmbed";

export type ShelfMedia = {
  type: "youtube" | "spotify";
  id: string;
  title: string;
};

// YouTube gives thumbnails for free; maxres isn't always present, so fall back.
function ytThumb(id: string, max = true) {
  return `https://img.youtube.com/vi/${id}/${max ? "maxresdefault" : "hqdefault"}.jpg`;
}

export function ShelfItem({
  item,
  label,
  active,
  onActivate,
}: {
  item: ShelfMedia;
  /** short index chip, e.g. "SET 01" */
  label: string;
  active: boolean;
  onActivate: () => void;
}) {
  const [fellBack, setFellBack] = useState(false);

  if (active) {
    return (
      <li className="shelf-item shelf-item--active">
        <div className="shelf-item__player">
          {item.type === "youtube" ? (
            <lite-youtube
              videoid={item.id}
              playlabel={`Play: ${item.title}`}
              style={{ borderRadius: "10px" }}
            />
          ) : (
            <SpotifyEmbed id={item.id} title={item.title} />
          )}
        </div>
        <div className="shelf-item__bar">
          <span className="shelf-item__title">{item.title}</span>
          <button type="button" className="shelf-item__collapse" onClick={onActivate}>
            Close
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="shelf-item">
      <button
        type="button"
        className="shelf-item__btn"
        onClick={onActivate}
        aria-label={`Play ${item.title}`}
      >
        <span className="shelf-item__thumb">
          {item.type === "youtube" ? (
            <img
              src={ytThumb(item.id, !fellBack)}
              alt=""
              loading="lazy"
              onError={() => !fellBack && setFellBack(true)}
            />
          ) : (
            <span className="shelf-item__spotify">Spotify</span>
          )}
          <span className="shelf-item__play" aria-hidden="true" />
        </span>
        <span className="shelf-item__meta">
          <span className="shelf-item__name">{item.title}</span>
          <span className="shelf-item__index">{label}</span>
        </span>
      </button>
    </li>
  );
}
