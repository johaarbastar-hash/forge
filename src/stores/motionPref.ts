import { useReducedMotion } from 'framer-motion';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Some mobile GPUs (notably ARM Mali, e.g. Samsung A-series) corrupt the
 * screen with garbage pixels when the browser composites animated/translucent
 * layers over scrolling content. Detect them via the WebGL renderer string so
 * animations default OFF on that hardware. Detection failure = not flaky.
 */
export function detectFlakyGpu(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    return /mali/i.test(renderer);
  } catch {
    return false;
  }
}

type MotionPrefState = {
  /** User/device preference to skip animations (OS-level pref is OR'd in by the hook). */
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
};

/**
 * Persisted UI pref (localStorage is fine for trivial UI prefs per SPEC §1).
 * Defaults ON for flaky GPUs; an explicit user choice always wins afterwards.
 */
export const useMotionPref = create<MotionPrefState>()(
  persist(
    (set) => ({
      reduceMotion: detectFlakyGpu(),
      setReduceMotion: (value) => set({ reduceMotion: value }),
    }),
    { name: 'forge-reduce-motion' },
  ),
);

/**
 * The app-wide reduced-motion signal: true when the in-app toggle is on OR the
 * OS requests reduced motion. Every animated component reads THIS, never
 * framer-motion's useReducedMotion directly.
 */
export function useAppReducedMotion(): boolean {
  const setting = useMotionPref((s) => s.reduceMotion);
  const os = useReducedMotion();
  return setting || !!os;
}
