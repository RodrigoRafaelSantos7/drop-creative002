"use client";

import { ZoomOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInfiniteCanvas } from "@/hooks/use-canvas";

const ZoomBar = () => {
  const { viewport } = useInfiniteCanvas();

  // TODO
  const handleZoomOut = () => {
    /*     const newScale = Math.max(viewport.scale, scale - 0.1);
    dispatch(setScale({ scale: newScale })); */
  };
  return (
    <div className="col-span-1 flex items-center justify-end">
      <div className="flex items-center gap-1 rounded-full border border-white/12 bg-white/8 p-3 saturate-150 backdrop-blur-xl">
        <Button
          className="border-transparent size-9 cursor-pointer rounded-full border p-0 transition-all hover:border-white/16 hover:bg-white/12"
          onClick={handleZoomOut}
          size="lg"
          variant="ghost"
        >
          <ZoomOutIcon className="size-4 text-primary/30" />
        </Button>
      </div>
    </div>
  );
};

export { ZoomBar };
