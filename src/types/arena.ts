// Nuclave Core Types

export const CONTRIBUTION_TYPES = [
  'benefit',
  'risk',
  'feature',
  'blocker',
  'checklist',
  'question',
  'decision',
  'wildcard',
] as const;

export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export const CONTRIBUTION_TYPE_META: Record<
  ContributionType,
  { label: string; icon: string; color: string; description: string }
> = {
  benefit: {
    label: 'Benefit / Pro',
    icon: 'check-circle',
    color: '#16a34a',
    description: 'A positive outcome, advantage, or reason to proceed',
  },
  risk: {
    label: 'Risk / Con',
    icon: 'alert-triangle',
    color: '#dc2626',
    description: 'A negative outcome, danger, or reason to reconsider',
  },
  feature: {
    label: 'Feature / Idea',
    icon: 'lightbulb',
    color: '#eab308',
    description: 'A specific suggestion, capability, or enhancement',
  },
  blocker: {
    label: 'Blocker / Critical',
    icon: 'octagon',
    color: '#b91c1c',
    description: 'Something that must be resolved before proceeding',
  },
  checklist: {
    label: 'Checklist Item',
    icon: 'check-square',
    color: '#2563eb',
    description: 'A mandatory step, requirement, or criterion',
  },
  question: {
    label: 'Open Question',
    icon: 'help-circle',
    color: '#7c3aed',
    description: 'Something that needs to be answered or investigated',
  },
  decision: {
    label: 'Decision Point',
    icon: 'flag',
    color: '#0d9488',
    description: 'A specific choice the group must make',
  },
  wildcard: {
    label: 'Wild Card',
    icon: 'sparkles',
    color: '#d946ef',
    description: 'An out-of-scope thought that might matter later',
  },
};

export const SIGNAL_TYPES = ['agree', 'critical', 'challenge'] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const SIGNAL_TYPE_META: Record<
  SignalType,
  { label: string; icon: string; description: string }
> = {
  agree: {
    label: 'Agree',
    icon: 'thumbs-up',
    description: 'This is real and important',
  },
  critical: {
    label: 'Critical',
    icon: 'zap',
    description: 'Must not be ignored, regardless of agreement',
  },
  challenge: {
    label: 'Challenge',
    icon: 'message-circle-question',
    description: "I don't understand or question the premise",
  },
};

export const ARENA_TYPES = [
  'software_planning',
  'product_critique',
  'policy_review',
  'strategic_decision',
  'retrospective',
  'brainstorm',
  'custom',
] as const;
export type ArenaType = (typeof ARENA_TYPES)[number];

export const ARENA_MODES = ['live', 'async'] as const;
export type ArenaMode = (typeof ARENA_MODES)[number];

export const ARENA_PHASES = [
  'ideation',
  'debate',
  'prioritization',
  'decision',
] as const;
export type ArenaPhase = (typeof ARENA_PHASES)[number];

export const PARTICIPANT_ROLES = [
  'facilitator',
  'expert',
  'contributor',
  'observer',
] as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];
