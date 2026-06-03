import { useEffect, useRef, useState } from "react";

import { PlaybackControls } from "@/components/PlaybackControls";
import { LottiePlayer } from "@/lib/lottie-player";

// The Lottie file lives in /public and is fetched at startup.
const LOTTIE_URL = "/lottie.json";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<LottiePlayer | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    (async () => {
      try {
        const res = await fetch(LOTTIE_URL);
        if (!res.ok) {
          throw new Error(`Failed to load ${LOTTIE_URL} (HTTP ${res.status})`);
        }
        const json = await res.text();
        if (disposed) return;

        const player = await LottiePlayer.create(canvas, json, {
          onFrame: (frame, total) => {
            setCurrentFrame(frame);
            setTotalFrames(total);
          },
          onPlayStateChange: setPlaying,
        });
        if (disposed) {
          player.dispose();
          return;
        }
        playerRef.current = player;
        setTotalFrames(player.getTotalFrames());
        setFps(player.getFps());
        player.play();
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    const observer = new ResizeObserver(() => playerRef.current?.resize());
    observer.observe(canvas);

    return () => {
      disposed = true;
      observer.disconnect();
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  return (
    <div className="dark relative h-full w-full overflow-hidden bg-neutral-950">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
        <PlaybackControls
          playing={playing}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          fps={fps}
          onToggle={() => playerRef.current?.toggle()}
          onSeek={(frame) => playerRef.current?.seek(frame)}
        />
      </div>
    </div>
  );
}
