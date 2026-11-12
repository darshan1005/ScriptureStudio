import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoPlayEngine } from '../../packages/presentation-engine/src/autoplay-engine.js';

describe('AutoPlay Engine Timer and Cycling', () => {
  let engine: AutoPlayEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new AutoPlayEngine();
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  it('starts and triggers advances according to dwell interval', () => {
    let callCount = 0;
    engine.start({
      dwellSeconds: 5,
      loop: false,
      onAdvance: () => {
        callCount++;
        return callCount < 3; // Stops after 3 calls
      },
    });

    expect(engine.active).toBe(true);

    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);
    expect(callCount).toBe(1);

    // Fast-forward another 5 seconds
    vi.advanceTimersByTime(5000);
    expect(callCount).toBe(2);

    // Fast-forward another 5 seconds
    vi.advanceTimersByTime(5000);
    expect(callCount).toBe(3);
    expect(engine.active).toBe(false); // Stoppped automatically at playlist end
  });

  it('stops immediately when stop() is called', () => {
    let callCount = 0;
    engine.start({
      dwellSeconds: 5,
      loop: true,
      onAdvance: () => {
        callCount++;
        return true;
      },
    });

    vi.advanceTimersByTime(5000);
    expect(callCount).toBe(1);

    engine.stop();
    expect(engine.active).toBe(false);

    vi.advanceTimersByTime(10000);
    expect(callCount).toBe(1); // No further advances
  });
});

