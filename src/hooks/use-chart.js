import { useEffect, useRef } from "preact/hooks";
import { reduceMotion } from "../state/settings-signals.js";

// draws a d3 chart into the returned ref, redraws on dep change and on container resize.
// only the first draw animates: live data redraws often and would replay the intro every time
export function useChart(draw, deps) {
  const ref = useRef(null);
  const drawRef = useRef(draw);
  const drawn = useRef(false);
  drawRef.current = draw;

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    let width = node.clientWidth;
    let frame = 0;

    drawRef.current(node, { animate: !drawn.current && !reduceMotion.peek() });
    drawn.current = true;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (node.clientWidth === width) {
          return;
        }

        width = node.clientWidth;
        drawRef.current(node, { animate: false });
      });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, deps);

  return ref;
}
