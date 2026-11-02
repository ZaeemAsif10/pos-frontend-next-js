"use client";

import { useEffect, useRef } from "react";

export function playScanBeep(success = true) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (success) {
      // Crisp 1400Hz POS beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } else {
      // Warning low frequency buzz
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    }
  } catch {
    // AudioContext blocked by browser policy until user interacts, safe to ignore
  }
}

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxDelayMs?: number;
  enabled?: boolean;
}

/**
 * Intelligent hardware barcode scanner listener.
 * Detects rapid burst keyboard input typical of USB/Bluetooth laser scanners.
 * Automatically buffers digits/characters and triggers onScan when Enter is fired.
 */
export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxDelayMs = 60,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const activeElement = document.activeElement as HTMLElement | null;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable);

      // If user is typing in a non-barcode text input (e.g. notes, search box), don't hijack unless Enter with fast buffer
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const scannedCode = bufferRef.current.trim();
        bufferRef.current = "";

        if (scannedCode.length >= minChars) {
          e.preventDefault();
          e.stopPropagation();
          onScan(scannedCode);
        }
        return;
      }

      // If keystrokes are coming too slow, it's a human typing, reset buffer
      if (timeSinceLastKey > maxDelayMs && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Accept printable characters
      if (e.key.length === 1 && !isInputFocused) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, minChars, maxDelayMs, onScan]);
}
