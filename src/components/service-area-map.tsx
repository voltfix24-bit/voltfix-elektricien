import { useState } from "react";
import { Maximize2 } from "lucide-react";
import amsterdamImg from "@/assets/amsterdam-map.webp.asset.json";
import { assetUrl } from "@/lib/asset-url";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = {
  alt: string;
  caption: string;
  previewLabel: string;
};

export function ServiceAreaMap({ alt, caption, previewLabel }: Props) {
  const [open, setOpen] = useState(false);
  const src = assetUrl(amsterdamImg);

  return (
    <>
      <figure className="relative overflow-hidden rounded-2xl border border-border">
        <img
          src={src}
          alt={alt}
          width={1920}
          height={1440}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={previewLabel}
          className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur transition hover:bg-background"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          {previewLabel}
        </button>
        <figcaption className="bg-background px-4 py-3 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      </figure>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">{previewLabel}</DialogTitle>
          <img src={src} alt={alt} className="h-auto w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
}
