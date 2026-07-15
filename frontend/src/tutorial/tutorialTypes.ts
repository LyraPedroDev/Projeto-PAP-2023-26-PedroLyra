import { ReactNode } from 'react';

export type AppSection = 'feed' | 'ranking' | 'tasks' | 'friends' | 'profile' | 'private' | 'admin';

export type TutorialStatus =
  | 'idle'
  | 'welcome'
  | 'showing'
  | 'navigating'
  | 'waiting'
  | 'completed'
  | 'skipped'
  | 'error'
  | 'dismissed';

export type TutorialReadiness = 'mounted' | 'layout-ready' | 'data-ready' | 'animation-ready';

export type TutorialError = {
  message: string;
  stepId: string;
};

export type TutorialStep = {
  id: string;
  section?: AppSection;
  target?: string;
  mobileTarget?: string;
  fallbackTarget?: string;
  fallbackMode?: 'center' | 'section-root' | 'skip';
  title: string;
  description: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  fallbackPlacements?: ('top' | 'bottom' | 'left' | 'right')[];
  iconName?: string;
  waitFor?: TutorialReadiness;
  readiness?: TutorialReadiness;
  allowInteraction?: boolean;
  disableOverlay?: boolean;
};

export type TutorialState = {
  status: TutorialStatus;
  currentStepIndex: number;
  pendingStepIndex: number | null;
  activeRequestId: string | null;
  requestedSection: AppSection | null;
  error: TutorialError | null;
  initialSection: AppSection | null;
  startedManually: boolean;
  completionSaving: boolean;
  completionError: string | null;
};

export type TutorialSectionEvent = {
  section: AppSection;
  requestId: string;
  status: 'ready' | 'error';
  error?: string;
};

export type TutorialContextValue = {
  state: TutorialState;
  steps: TutorialStep[];
  startTutorial: (startSection?: AppSection, startedManually?: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  closeTutorial: () => void;
  retryCurrentStep: () => void;
  completeTutorial: () => Promise<boolean>;
  notifySectionReady: (event: TutorialSectionEvent) => void;
};
