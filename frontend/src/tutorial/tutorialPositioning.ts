import { computePosition, flip, shift, offset, arrow, Placement } from '@floating-ui/react';

export async function getTooltipPosition(
  targetRect: DOMRect,
  tooltipEl: HTMLElement,
  arrowEl: HTMLElement | null,
  placement: Placement = 'bottom',
  fallbackPlacements: Placement[] = ['top', 'left', 'right']
) {
  // Criar um "Virtual Element" compatível com Floating UI baseado no targetRect
  const virtualElement = {
    getBoundingClientRect() {
      return targetRect;
    },
  };

  const middleware = [
    offset(16), // distância do spotlight
    flip({ fallbackPlacements }),
    shift({ padding: 16 }), // padding para as margens da viewport
  ];

  if (arrowEl) {
    middleware.push(arrow({ element: arrowEl }));
  }

  const { x, y, placement: finalPlacement, middlewareData } = await computePosition(
    virtualElement,
    tooltipEl,
    {
      placement,
      middleware,
    }
  );

  return {
    x,
    y,
    placement: finalPlacement,
    arrowX: middlewareData.arrow?.x,
    arrowY: middlewareData.arrow?.y,
  };
}
