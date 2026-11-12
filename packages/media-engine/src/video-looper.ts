export interface VideoLooperConfig {
  videoUrl: string;
  muted: boolean;
  loop: boolean;
  playbackRate: number;
}

export function createDefaultVideoLooperConfig(videoUrl: string): VideoLooperConfig {
  return {
    videoUrl,
    muted: true, // Presentation video backgrounds must be strictly muted
    loop: true,
    playbackRate: 1.0,
  };
}

