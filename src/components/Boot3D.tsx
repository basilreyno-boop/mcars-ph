import { useEffect, useRef, useState } from "react";
import { startBoot3D } from "@/game/boot3d";

export function BootStage({ progress }: { progress: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const handle = useRef<ReturnType<typeof startBoot3D>>(null);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    handle.current = startBoot3D(canvas, reduced);
    if (!handle.current) setOk(false);
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    handle.current?.setProgress(progress);
  }, [progress]);

  return (
    <>
      {!ok ? (
        <img
          src="/sprites/powers/john.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <canvas
        ref={ref}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      />
    </>
  );
}
