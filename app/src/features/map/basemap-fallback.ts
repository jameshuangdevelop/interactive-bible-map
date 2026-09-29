import {
  FALLBACK_MESSAGE,
  TILE_ERROR_THRESHOLD,
  TILE_ERROR_WINDOW_MS
} from "./constants";

export type BasemapMode = "main" | "fallback";

interface BasemapFallbackOptions {
  threshold?: number;
  windowMs?: number;
  fallbackMessage?: string;
  initialMode?: BasemapMode;
}

export interface BasemapFallbackState {
  mode: BasemapMode;
  message: string | null;
}

export class MainSourceLoadTimeoutController {
  private hasLoaded = false;

  arm({ alreadyLoaded }: { alreadyLoaded: boolean }) {
    this.hasLoaded = alreadyLoaded;
  }

  markLoaded() {
    this.hasLoaded = true;
  }

  shouldSwitchToFallback({ currentlyLoaded }: { currentlyLoaded: boolean }) {
    if (currentlyLoaded) {
      this.hasLoaded = true;
      return false;
    }

    return !this.hasLoaded;
  }
}

export function resolveInitialBasemapMode(envValue: string | undefined): BasemapMode {
  if (envValue?.toLowerCase() === "fallback") {
    return "fallback";
  }

  return "main";
}

export class BasemapFallbackController {
  private readonly threshold: number;
  private readonly windowMs: number;
  private readonly fallbackMessage: string;
  private mode: BasemapMode;
  private readonly recentErrorTimes: number[];
  private message: string | null;

  constructor(options: BasemapFallbackOptions = {}) {
    this.threshold = options.threshold ?? TILE_ERROR_THRESHOLD;
    this.windowMs = options.windowMs ?? TILE_ERROR_WINDOW_MS;
    this.fallbackMessage = options.fallbackMessage ?? FALLBACK_MESSAGE;
    this.mode = options.initialMode ?? "main";
    this.message = null;
    this.recentErrorTimes = [];
  }

  getState(): BasemapFallbackState {
    return { mode: this.mode, message: this.message };
  }

  setMode(mode: BasemapMode) {
    this.mode = mode;
    this.recentErrorTimes.length = 0;
    this.message = null;
  }

  registerTileError(atTimeMs: number): BasemapFallbackState {
    if (this.mode === "fallback") {
      return this.getState();
    }

    this.recentErrorTimes.push(atTimeMs);
    const minimumTime = atTimeMs - this.windowMs;

    while (this.recentErrorTimes.length > 0 && this.recentErrorTimes[0] < minimumTime) {
      this.recentErrorTimes.shift();
    }

    if (this.recentErrorTimes.length >= this.threshold) {
      this.switchToFallback();
    }

    return this.getState();
  }

  switchToFallback(): BasemapFallbackState {
    if (this.mode !== "fallback") {
      this.mode = "fallback";
      this.message = this.fallbackMessage;
      this.recentErrorTimes.length = 0;
    }

    return this.getState();
  }
}
