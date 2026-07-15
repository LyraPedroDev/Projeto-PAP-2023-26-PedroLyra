import { useState, useEffect, useCallback } from 'react';

type Bounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type UseTutorialTargetBoundsProps = {
  targetSelector?: string;
  isActive: boolean;
};

export function useTutorialTargetBounds({ targetSelector, isActive }: UseTutorialTargetBoundsProps) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateBounds = useCallback(() => {
    if (!targetSelector || !isActive) {
      setBounds(null);
      setIsVisible(false);
      return;
    }

    const element = document.querySelector(targetSelector);
    if (!element) {
      setBounds(null);
      setIsVisible(false);
      return;
    }

    const rect = element.getBoundingClientRect();
    
    // Validar se o elemento é válido
    const style = window.getComputedStyle(element);
    if (rect.width === 0 || rect.height === 0 || style.display === 'none' || style.visibility === 'hidden') {
      setBounds(null);
      setIsVisible(false);
      return;
    }

    setBounds({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [targetSelector, isActive]);

  useEffect(() => {
    if (!targetSelector || !isActive) return;

    // Inicial update
    updateBounds();

    let element = document.querySelector(targetSelector);
    let observer: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const setupObservers = (el: Element) => {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            setIsVisible(true);
            updateBounds();
          } else {
            setIsVisible(false);
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            el.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);

      resizeObserver = new ResizeObserver(() => {
        updateBounds();
      });
      resizeObserver.observe(el);
    };

    if (element) {
      setupObservers(element);
    } else {
      mutationObserver = new MutationObserver(() => {
        const el = document.querySelector(targetSelector);
        if (el) {
          element = el;
          updateBounds();
          setupObservers(el);
          mutationObserver?.disconnect();
          mutationObserver = null;
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds, { capture: true });

    return () => {
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateBounds);
      mutationObserver?.disconnect();
      window.removeEventListener('scroll', updateBounds, { capture: true });
    };
  }, [targetSelector, isActive, updateBounds]);

  return { bounds, isVisible };
}

