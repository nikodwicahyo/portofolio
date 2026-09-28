// Refcounted console.warn silencer — pdf.js prints noisy-but-harmless warnings
// during parse/render. Naive save/restore races across concurrent renders:
// A saves real, B saves A's noop, A restores real, B restores the noop →
// console.warn is dead for the whole app. Ownership is reference-counted so
// only the last restore reinstalls the original. Never throws.

let depth = 0;
let saved = null;

export function silenceWarn() {
  if (depth++ === 0) {
    saved = console.warn;
    console.warn = () => {};
  }
  return function restoreWarn() {
    if (depth > 0 && --depth === 0 && saved) {
      console.warn = saved;
      saved = null;
    }
  };
}
