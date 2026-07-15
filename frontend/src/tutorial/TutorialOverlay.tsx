import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { useFloating, autoUpdate, offset, flip, shift, Placement } from '@floating-ui/react';
import { toast } from 'sonner';
import { useTutorial } from './TutorialProvider';
import { TutorialSpotlight } from './TutorialSpotlight';
import { TutorialTooltip } from './TutorialTooltip';
import { TutorialWelcome } from './TutorialWelcome';
import { useTutorialTargetBounds } from './useTutorialTargetBounds';

type TutorialOverlayProps = {
  isDarkMode: boolean;
};

export function TutorialOverlay({ isDarkMode }: TutorialOverlayProps) {
  const {
    state,
    steps,
    nextStep,
    previousStep,
    closeTutorial,
    skipTutorial,
    retryCurrentStep,
    completeTutorial,
  } = useTutorial();

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentStep = steps[state.currentStepIndex];

  const targetSelector = useMemo(() => {
    if (!currentStep || currentStep.placement === 'center') return undefined;
    const preferred = isSmallScreen && currentStep.mobileTarget ? currentStep.mobileTarget : currentStep.target;
    if (preferred && document.querySelector(preferred)) return preferred;
    if (currentStep.fallbackTarget && document.querySelector(currentStep.fallbackTarget)) return currentStep.fallbackTarget;
    return preferred || currentStep.fallbackTarget;
  }, [currentStep, isSmallScreen]);

  const { bounds } = useTutorialTargetBounds({
    targetSelector,
    isActive: state.status === 'showing' || state.status === 'navigating' || state.status === 'waiting' || state.status === 'error',
  });

  const { refs, floatingStyles } = useFloating({
    placement: (currentStep?.placement as Placement) || 'bottom',
    strategy: 'fixed',
    middleware: [
      offset(16),
      flip({ fallbackPlacements: (currentStep?.fallbackPlacements as Placement[]) || ['bottom', 'top', 'left', 'right'] }),
      shift({ padding: 16 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (bounds && !isSmallScreen) {
      refs.setReference({
        getBoundingClientRect() {
          return {
            x: bounds.left,
            y: bounds.top,
            top: bounds.top,
            left: bounds.left,
            bottom: bounds.top + bounds.height,
            right: bounds.left + bounds.width,
            width: bounds.width,
            height: bounds.height,
          } as DOMRect;
        },
      });
    } else {
      refs.setReference(null);
    }
  }, [bounds, refs, isSmallScreen]);

  useEffect(() => {
    if (currentStep?.id !== 'ecobot') {
      window.dispatchEvent(new Event('close-ai-modal'));
    }
  }, [currentStep?.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.status !== 'completed') {
        closeTutorial();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeTutorial, state.status]);

  const handleComplete = async () => {
    const saved = await completeTutorial();
    if (saved) {
      toast.success('Tutorial concluído.');
    }
  };

  const handleSkip = () => {
    skipTutorial();
    toast.message('Podes rever o tutorial mais tarde no Perfil.');
  };

  if (state.status === 'idle' || state.status === 'dismissed' || state.status === 'skipped') {
    return null;
  }

  const isNavigating = state.status === 'navigating' || state.status === 'waiting';

  const finalTooltipStyle: React.CSSProperties = isSmallScreen
    ? {
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        maxHeight: '70dvh',
        overflowY: 'auto',
        zIndex: 10000,
        visibility: 'visible',
        pointerEvents: 'auto',
        transform: 'none',
        top: 'auto'
      }
    : {
        ...floatingStyles,
        zIndex: 10000,
        visibility: (bounds && !isNavigating && floatingStyles.transform) ? 'visible' : 'hidden',
        pointerEvents: (bounds && !isNavigating && floatingStyles.transform) ? 'auto' : 'none',
      };

  // Se está a navegar, mostrar ao centro
  if (isNavigating && !isSmallScreen) {
    finalTooltipStyle.position = 'fixed';
    finalTooltipStyle.top = '50%';
    finalTooltipStyle.left = '50%';
    finalTooltipStyle.transform = 'translate(-50%, -50%)';
    finalTooltipStyle.visibility = 'visible';
    finalTooltipStyle.pointerEvents = 'auto';
  }

  const overlayContent = (
    <AnimatePresence mode="wait">
      {state.status === 'welcome' && (
        <TutorialWelcome
          key="welcome"
          mode="welcome"
          state={state}
          isDarkMode={isDarkMode}
          onAction={nextStep}
          onClose={handleSkip}
        />
      )}

      {state.status === 'completed' && (
        <TutorialWelcome
          key="completed"
          mode="completion"
          state={state}
          isDarkMode={isDarkMode}
          onAction={handleComplete}
          onClose={closeTutorial}
        />
      )}

      {(state.status === 'showing' || state.status === 'navigating' || state.status === 'waiting' || state.status === 'error') && currentStep && (
        <div key="overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
          <TutorialSpotlight bounds={isNavigating ? null : bounds} isDarkMode={isDarkMode} disableOverlay={currentStep.disableOverlay} />

          <TutorialTooltip
            ref={refs.setFloating}
            style={finalTooltipStyle}
            step={currentStep}
            state={state}
            totalSteps={steps.length}
            onNext={nextStep}
            onPrev={previousStep}
            onSkip={handleSkip}
            onRetry={retryCurrentStep}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlayContent, document.body);
}
