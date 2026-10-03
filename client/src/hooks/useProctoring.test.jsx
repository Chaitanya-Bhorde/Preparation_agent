/**
 * Proctoring regression tests.
 *
 * THE BUG THIS GUARDS: MockInterview re-renders once per second (its elapsed
 * timer). The hook used to build handleViolation with useCallback(...,
 * [onViolation, onAutoSubmit]) and those callbacks are inline arrows, so the
 * face-sampling interval was torn down and recreated on EVERY render. With a
 * 3 s interval and a 1 s re-render it never survived long enough to fire: a
 * candidate could leave the frame or cover the camera and never see a warning.
 *
 * The harness below deliberately re-renders the consumer every 1000 ms, which
 * is exactly the condition that broke before.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createElement, useEffect, useState } from 'react';
import useProctoring from './useProctoring';

const RE_RENDER_MS = 1000;
const SKIN = [235, 185, 150, 255];
const DARK = [10, 10, 12, 255];

let container;
let root;
let framePixels = 'skin';

function installVideoStub() {
  // happy-dom has no MediaStream plumbing; give the element a writable
  // srcObject and a resolved play().
  Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
    configurable: true,
    writable: true,
    value: null,
  });
  HTMLVideoElement.prototype.play = function play() { return Promise.resolve(); };
}

function installCanvasStub() {
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return {
      drawImage() {},
      getImageData() {
        const data = new Uint8ClampedArray(160 * 160 * 4);
        for (let i = 0; i < data.length; i += 4) {
          const px = framePixels === 'skin' ? SKIN : DARK;
          data[i] = px[0]; data[i + 1] = px[1]; data[i + 2] = px[2]; data[i + 3] = px[3];
        }
        return { data };
      },
    };
  };
}

function mountProctoring(onTick = () => {}) {
  const api = { current: null };

  function Harness() {
    const [, setTick] = useState(0);
    const proctoring = useProctoring({
      enabled: true,
      onViolation: (reason, count) => onTick('violation', { reason, count }),
      onAutoSubmit: (reason) => onTick('autoSubmit', { reason }),
    });
    api.current = proctoring;
    useEffect(() => {
      const t = setInterval(() => setTick((n) => n + 1), RE_RENDER_MS);
      return () => clearInterval(t);
    }, []);
    return createElement('video', { ref: proctoring.setVideoElement });
  }

  act(() => { root.render(createElement(Harness)); });
  return api;
}

async function startCamera(api) {
  await act(async () => { await api.current.startCamera(); });
}

beforeEach(() => {
  // React only flushes updates synchronously inside act() when this flag is set.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  framePixels = 'skin';
  installVideoStub();
  installCanvasStub();
  navigator.mediaDevices = { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })) };
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useProctoring', () => {
  it('starts the camera and reports it active', async () => {
    const api = mountProctoring();
    await startCamera(api);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    expect(api.current.cameraActive).toBe(true);
    expect(api.current.cameraError).toBeNull();
  });

  it('surfaces a permission-denied error instead of pretending the camera is fine', async () => {
    navigator.mediaDevices.getUserMedia = vi.fn(async () => {
      const e = new Error('denied');
      e.name = 'NotAllowedError';
      throw e;
    });
    const api = mountProctoring();
    await startCamera(api);
    expect(api.current.cameraActive).toBe(false);
    expect(api.current.cameraError).toMatch(/permission denied/i);
  });

  it('surfaces a missing-camera error', async () => {
    navigator.mediaDevices.getUserMedia = vi.fn(async () => {
      const e = new Error('none');
      e.name = 'NotFoundError';
      throw e;
    });
    const api = mountProctoring();
    await startCamera(api);
    expect(api.current.cameraError).toMatch(/No camera found/i);
  });
it('raises a warning when the face leaves the frame, even while the screen re-renders every second', async () => {
    const events = [];
    const api = mountProctoring((kind, payload) => events.push({ kind, payload }));
    await startCamera(api);

    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(api.current.faceDetected).toBe(true);
    expect(api.current.violationCount).toBe(0);
    expect(events.filter((e) => e.kind === 'violation')).toHaveLength(0);

    framePixels = 'dark';
    await act(async () => { await vi.advanceTimersByTimeAsync(3500); });
    expect(api.current.faceDetected).toBe(false);
    expect(api.current.violationCount).toBe(1);
    expect(events[0]).toEqual({ kind: 'violation', payload: { reason: 'NO_FACE', count: 1 } });
    expect(api.current.lastWarning.message).toMatch(/Warning 1\/2/);
  });

  it('recovers when the face returns, then warns again and auto-submits on the third violation', async () => {
    const events = [];
    const api = mountProctoring((kind, payload) => events.push({ kind, payload }));
    await startCamera(api);

    framePixels = 'dark';
    await act(async () => { await vi.advanceTimersByTimeAsync(3500); });
    expect(api.current.violationCount).toBe(1);

    framePixels = 'skin';
    await act(async () => { await vi.advanceTimersByTimeAsync(3500); });
    expect(api.current.faceDetected).toBe(true);

    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    framePixels = 'dark';
    await act(async () => { await vi.advanceTimersByTimeAsync(3500); });
    expect(api.current.violationCount).toBe(2);
    expect(api.current.lastWarning.message).toMatch(/Warning 2\/2/);

    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    framePixels = 'dark';
    await act(async () => { await vi.advanceTimersByTimeAsync(3500); });
    expect(api.current.violationCount).toBeGreaterThanOrEqual(3);
    expect(api.current.autoSubmitted).toBe(true);
    expect(events.filter((e) => e.kind === 'autoSubmit')).toHaveLength(1);
  });

  it('does not warn while the face stays visible for a long interview', async () => {
    const api = mountProctoring();
    await startCamera(api);
    await act(async () => { await vi.advanceTimersByTimeAsync(120000); });
    expect(api.current.violationCount).toBe(0);
    expect(api.current.faceDetected).toBe(true);
    expect(api.current.autoSubmitted).toBe(false);
  });

  it('stops the camera on request', async () => {
    const api = mountProctoring();
    await startCamera(api);
    await act(async () => { api.current.stopCamera(); });
    expect(api.current.cameraActive).toBe(false);
  });

  it('reset() clears the violation state', async () => {
    const api = mountProctoring();
    await startCamera(api);
    framePixels = 'dark';
    await act(async () => { await vi.advanceTimersByTimeAsync(3500); });
    expect(api.current.violationCount).toBe(1);
    await act(async () => { api.current.reset(); });
    expect(api.current.violationCount).toBe(0);
    expect(api.current.lastWarning).toBeNull();
    expect(api.current.faceDetected).toBe(true);
  });
});