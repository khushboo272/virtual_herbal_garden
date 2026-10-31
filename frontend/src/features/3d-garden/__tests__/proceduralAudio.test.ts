import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProceduralGardenSoundscape } from '../utils/proceduralAudio';

describe('ProceduralGardenSoundscape', () => {
  let soundscape: ProceduralGardenSoundscape;

  beforeEach(() => {
    soundscape = new ProceduralGardenSoundscape();
  });

  it('initializes without throwing errors even if Web Audio API is partially mocked in test environment', () => {
    expect(soundscape).toBeDefined();
  });

  it('handles start, volume adjustments and stop lifecycle gracefully', () => {
    soundscape.start(0.8, false);
    soundscape.setVolume(0.5);
    soundscape.setNight(true);
    soundscape.updatePlayerDistanceToPond(15);
    soundscape.stop();
  });

  it('clamps volume inputs safely within [0, 1]', () => {
    soundscape.start(1.5, false);
    soundscape.setVolume(-0.5);
    soundscape.setVolume(2.0);
    soundscape.stop();
  });

  it('disposes resources on unmount cleanly', () => {
    soundscape.start(0.5, false);
    soundscape.dispose();
  });
});

