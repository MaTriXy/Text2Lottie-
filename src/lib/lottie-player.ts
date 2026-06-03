import CanvasKitInit, {
  type CanvasKit,
  type Surface,
  type ManagedSkottieAnimation,
} from "canvaskit-wasm/full";

let canvasKitPromise: Promise<CanvasKit> | null = null;

/** Loads (and caches) the CanvasKit WASM module. */
export function loadCanvasKit(): Promise<CanvasKit> {
  if (!canvasKitPromise) {
    canvasKitPromise = CanvasKitInit({
      // The wasm binary is copied into /public by scripts/copy-canvaskit.mjs.
      locateFile: () => "/canvaskit.wasm",
    });
  }
  return canvasKitPromise;
}

export interface LottiePlayerCallbacks {
  /** Fired every rendered frame with the playhead frame and total frame count. */
  onFrame?: (currentFrame: number, totalFrames: number) => void;
  /** Fired whenever the play/pause state changes. */
  onPlayStateChange?: (playing: boolean) => void;
}

/**
 * Renders a Lottie animation onto a <canvas> using Skia's Skottie module via
 * CanvasKit. Owns its own requestAnimationFrame loop and a WebGL surface that
 * is recreated on resize. The playhead is tracked in frames; playback advances
 * it off wall-clock time scaled by the animation's fps, so it plays at native
 * speed regardless of the render frame rate.
 */
export class LottiePlayer {
  private surface: Surface | null = null;
  private rafId = 0;
  private playing = false;
  private currentFrame = 0;
  private lastTs = 0;
  private readonly fps: number;
  private readonly totalFrames: number;

  constructor(
    private readonly ck: CanvasKit,
    private readonly canvas: HTMLCanvasElement,
    private readonly animation: ManagedSkottieAnimation,
    private readonly callbacks: LottiePlayerCallbacks = {}
  ) {
    this.fps = animation.fps() || 60;
    this.totalFrames = Math.max(1, Math.round(animation.duration() * this.fps));
    this.resize();
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Builds a player from a Lottie JSON string, loading CanvasKit if needed. */
  static async create(
    canvas: HTMLCanvasElement,
    lottieJson: string,
    callbacks?: LottiePlayerCallbacks
  ): Promise<LottiePlayer> {
    const ck = await loadCanvasKit();
    const animation = ck.MakeManagedAnimation(lottieJson);
    if (!animation) {
      throw new Error("CanvasKit could not parse the Lottie file.");
    }
    return new LottiePlayer(ck, canvas, animation, callbacks);
  }

  getFps(): number {
    return this.fps;
  }

  getTotalFrames(): number {
    return this.totalFrames;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.lastTs = 0; // reset so the first tick after resume has no jump
    this.callbacks.onPlayStateChange?.(true);
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.callbacks.onPlayStateChange?.(false);
  }

  toggle(): void {
    this.playing ? this.pause() : this.play();
  }

  /** Seeks to an absolute frame. */
  seek(frame: number): void {
    this.currentFrame = Math.max(0, Math.min(frame, this.totalFrames));
    this.lastTs = 0;
    this.draw();
    this.callbacks.onFrame?.(this.currentFrame, this.totalFrames);
  }

  /** Syncs the backing store to the element's CSS size and recreates the surface. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width === width && this.canvas.height === height && this.surface) {
      return;
    }
    this.canvas.width = width;
    this.canvas.height = height;

    this.surface?.delete();
    const surface = this.ck.MakeWebGLCanvasSurface(this.canvas);
    if (!surface) {
      throw new Error("Could not create a WebGL surface for CanvasKit.");
    }
    this.surface = surface;
    this.draw();
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.surface?.delete();
    this.surface = null;
    this.animation.delete();
  }

  private tick = (ts: number): void => {
    if (this.playing) {
      if (this.lastTs !== 0) {
        const dt = (ts - this.lastTs) / 1000;
        this.currentFrame += dt * this.fps;
        if (this.currentFrame >= this.totalFrames) {
          this.currentFrame %= this.totalFrames; // loop
        }
      }
      this.lastTs = ts;
      this.draw();
      this.callbacks.onFrame?.(this.currentFrame, this.totalFrames);
    }
    this.rafId = requestAnimationFrame(this.tick);
  };

  private draw(): void {
    if (!this.surface) return;
    const canvas = this.surface.getCanvas();
    canvas.clear(this.ck.TRANSPARENT);

    const [w, h] = this.animation.size();
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const scale = Math.min(cw / w, ch / h);
    const dw = w * scale;
    const dh = h * scale;
    const left = (cw - dw) / 2;
    const top = (ch - dh) / 2;

    this.animation.seekFrame(this.currentFrame);
    this.animation.render(canvas, this.ck.LTRBRect(left, top, left + dw, top + dh));
    this.surface.flush();
  }
}
