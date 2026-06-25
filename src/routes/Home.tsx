// src/routes/Home.tsx — Phase 1 placeholder.
// Later (§6): loader → 3D bear hero → bio → work toggle → contact → footer.
import { Placeholder } from "../components/Placeholder";
import { site } from "../data/site.config";

export default function Home() {
  return (
    <Placeholder eyebrow={site.tagline} title={site.name}>
      {site.blurb}
    </Placeholder>
  );
}
