import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppSection,
  TutorialContextValue,
  TutorialSectionEvent,
  TutorialState,
} from './tutorialTypes';
import { getAvailableTutorialSteps } from './tutorialSteps';
import { apiFetch } from '../services/api';

const TutorialContext = createContext<TutorialContextValue | null>(null);

const CURRENT_TUTORIAL_VERSION = 2;
const SESSION_KEY = 'ecochat_tutorial_session';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 15);
};

const createInitialState = (): TutorialState => ({
  status: 'idle',
  currentStepIndex: 0,
  pendingStepIndex: null,
  activeRequestId: null,
  requestedSection: null,
  error: null,
  initialSection: null,
  startedManually: false,
  completionSaving: false,
  completionError: null,
});

type TutorialProviderProps = {
  children: React.ReactNode;
  isAdmin: boolean;
  isMobile: boolean;
  onChangeSection?: (section: AppSection) => void;
  onTutorialCompleted?: () => void;
};

export function TutorialProvider({
  children,
  isAdmin,
  isMobile,
  onChangeSection,
  onTutorialCompleted,
}: TutorialProviderProps) {
  const steps = useMemo(() => getAvailableTutorialSteps({ isAdmin, isMobile }), [isAdmin, isMobile]);
  const [state, setState] = useState<TutorialState>(() => createInitialState());

  const persistSession = useCallback((nextState: TutorialState) => {
    if (typeof window === 'undefined') return;

    const activeStatuses = new Set(['welcome', 'showing', 'navigating', 'waiting', 'error', 'completed']);
    if (!activeStatuses.has(nextState.status)) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }

    const currentStep = steps[nextState.pendingStepIndex ?? nextState.currentStepIndex];
    if (!currentStep) return;

    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        version: CURRENT_TUTORIAL_VERSION,
        currentStepId: currentStep.id,
        startedManually: nextState.startedManually,
      }),
    );
  }, [steps]);

  useEffect(() => {
    persistSession(state);
  }, [persistSession, state]);

  useEffect(() => {
    if ((state.status === 'dismissed' || state.status === 'skipped') && state.startedManually && state.initialSection) {
      onChangeSection?.(state.initialSection);
    }
  }, [onChangeSection, state.initialSection, state.startedManually, state.status]);

  const startTutorial = useCallback((startSection: AppSection = 'feed', startedManually = false) => {
    setState({
      ...createInitialState(),
      status: 'welcome',
      initialSection: startSection,
      startedManually,
    });
  }, []);

  const closeTutorial = useCallback(() => {
    setState(prev => ({
      ...createInitialState(),
      status: 'dismissed',
      initialSection: prev.initialSection,
      startedManually: prev.startedManually,
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...createInitialState(),
      status: 'skipped',
      initialSection: prev.initialSection,
      startedManually: prev.startedManually,
    }));
  }, []);

  const moveToStep = useCallback((targetIndex: number) => {
    setState(prev => {
      if (prev.status === 'navigating' || prev.status === 'waiting' || prev.completionSaving) return prev;

      const targetStep = steps[targetIndex];
      if (!targetStep) return prev;

      const currentStep = steps[prev.currentStepIndex];
      const nextSection = targetStep.section;
      const isSameSection = !nextSection || currentStep?.section === nextSection;

      if (targetStep.placement === 'center' || !nextSection || isSameSection) {
        return {
          ...prev,
          status: targetStep.id === 'welcome' ? 'welcome' : targetStep.id === 'conclusion' ? 'completed' : 'showing',
          currentStepIndex: targetIndex,
          pendingStepIndex: null,
          activeRequestId: null,
          requestedSection: null,
          error: null,
          completionError: null,
        };
      }

      return {
        ...prev,
        status: 'navigating',
        pendingStepIndex: targetIndex,
        requestedSection: nextSection,
        activeRequestId: generateId(),
        error: null,
        completionError: null,
      };
    });
  }, [steps]);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.status === 'error') return prev;
      if (prev.status === 'navigating' || prev.status === 'waiting' || prev.completionSaving) return prev;
      if (prev.currentStepIndex >= steps.length - 1) {
        return { ...prev, status: 'completed', completionError: null };
      }
      return prev;
    });

    setState(prev => {
      if (prev.status === 'error' || prev.status === 'navigating' || prev.status === 'waiting' || prev.completionSaving) {
        return prev;
      }
      const targetIndex = Math.min(prev.currentStepIndex + 1, steps.length - 1);
      const targetStep = steps[targetIndex];
      if (!targetStep) return prev;

      const currentStep = steps[prev.currentStepIndex];
      const nextSection = targetStep.section;
      const isSameSection = !nextSection || currentStep?.section === nextSection;

      if (targetStep.placement === 'center' || !nextSection || isSameSection) {
        return {
          ...prev,
          status: targetStep.id === 'conclusion' ? 'completed' : 'showing',
          currentStepIndex: targetIndex,
          pendingStepIndex: null,
          activeRequestId: null,
          requestedSection: null,
          error: null,
        };
      }

      return {
        ...prev,
        status: 'navigating',
        pendingStepIndex: targetIndex,
        requestedSection: nextSection,
        activeRequestId: generateId(),
        error: null,
      };
    });
  }, [steps]);

  const previousStep = useCallback(() => {
    setState(prev => {
      if (prev.status === 'navigating' || prev.status === 'waiting' || prev.completionSaving) return prev;
      if (prev.currentStepIndex <= 0) return prev;

      const targetIndex = prev.currentStepIndex - 1;
      const targetStep = steps[targetIndex];
      const currentStep = steps[prev.currentStepIndex];
      if (!targetStep) return prev;

      const nextSection = targetStep.section;
      const isSameSection = !nextSection || currentStep?.section === nextSection;

      if (targetStep.placement === 'center' || !nextSection || isSameSection) {
        return {
          ...prev,
          status: targetStep.id === 'welcome' ? 'welcome' : 'showing',
          currentStepIndex: targetIndex,
          pendingStepIndex: null,
          activeRequestId: null,
          requestedSection: null,
          error: null,
          completionError: null,
        };
      }

      return {
        ...prev,
        status: 'navigating',
        pendingStepIndex: targetIndex,
        requestedSection: nextSection,
        activeRequestId: generateId(),
        error: null,
        completionError: null,
      };
    });
  }, [steps]);

  useEffect(() => {
    if (state.status !== 'navigating' || !state.requestedSection) return;
    onChangeSection?.(state.requestedSection);
    setState(prev => (prev.activeRequestId === state.activeRequestId ? { ...prev, status: 'waiting' } : prev));
  }, [onChangeSection, state.activeRequestId, state.requestedSection, state.status]);

  const retryCurrentStep = useCallback(() => {
    setState(prev => {
      if (prev.status === 'error' && prev.requestedSection) {
        return {
          ...prev,
          status: 'navigating',
          activeRequestId: generateId(),
          error: null,
        };
      }
      return { ...prev, status: 'showing', error: null };
    });
  }, []);

  const completeTutorial = useCallback(async () => {
    setState(prev => ({ ...prev, completionSaving: true, completionError: null }));

    try {
      const response = await apiFetch('/api/profile/tutorial', { method: 'PUT' });
      if (!response.ok) {
        throw new Error('Não foi possível guardar a conclusão do tutorial.');
      }

      onTutorialCompleted?.();
      onChangeSection?.('feed');
      setState({ ...createInitialState(), status: 'dismissed' });
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível guardar a conclusão do tutorial.';
      setState(prev => ({
        ...prev,
        status: 'completed',
        completionSaving: false,
        completionError: message,
      }));
      return false;
    }
  }, [onChangeSection, onTutorialCompleted]);

  const notifySectionReady = useCallback((event: TutorialSectionEvent) => {
    setState(prev => {
      if (prev.status !== 'waiting') return prev;
      if (prev.requestedSection !== event.section || prev.activeRequestId !== event.requestId) return prev;

      if (event.status === 'error') {
        return {
          ...prev,
          status: 'error',
          error: {
            message: event.error || 'Erro ao carregar secção',
            stepId: steps[prev.pendingStepIndex ?? prev.currentStepIndex]?.id || '',
          },
        };
      }

      return {
        ...prev,
        status: 'showing',
        currentStepIndex: prev.pendingStepIndex ?? prev.currentStepIndex,
        pendingStepIndex: null,
        activeRequestId: null,
        requestedSection: null,
        error: null,
      };
    });
  }, [steps]);

  const contextValue: TutorialContextValue = {
    state,
    steps,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    closeTutorial,
    retryCurrentStep,
    completeTutorial,
    notifySectionReady,
  };

  return <TutorialContext.Provider value={contextValue}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}


