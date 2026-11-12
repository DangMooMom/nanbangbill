import { useEffect, useRef } from 'react';

/**
 * One shared hover tooltip. Any element with `data-tip` shows it;
 * `data-c` adds that heater's colour chip in front of the text.
 */
export function TooltipLayer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tip = ref.current!;
    const onMove = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest?.('[data-tip]');
      if (!target) {
        tip.classList.remove('on');
        return;
      }
      tip.textContent = '';
      const colour = target.getAttribute('data-c');
      if (colour) {
        const sw = document.createElement('span');
        sw.className = 'sw';
        sw.style.background = colour;
        tip.appendChild(sw);
      }
      tip.appendChild(document.createTextNode(target.getAttribute('data-tip') ?? ''));
      tip.classList.add('on');
      tip.style.left = Math.max(8, Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8)) + 'px';
      tip.style.top = e.clientY - tip.offsetHeight - 10 + 'px';
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  return <div className="tip" role="tooltip" ref={ref} />;
}
