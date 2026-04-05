export interface ArenaTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  defaultTitle: string;
  contextPrompt: string;
  phaseDurations: { ideation: number; debate: number; prioritization: number; decision: number };
  starterPrompts: string[];
}

export const ARENA_TEMPLATES: ArenaTemplate[] = [
  {
    id: 'sprint-retro',
    name: 'Sprint Retrospective',
    description: 'Reflect on what worked, what didn\'t, and what to improve next sprint.',
    icon: 'rotate-ccw',
    type: 'retrospective',
    defaultTitle: 'Sprint Retrospective',
    contextPrompt: 'Think about the last sprint. What went well? What was frustrating? What should we change?',
    phaseDurations: { ideation: 10, debate: 15, prioritization: 10, decision: 5 },
    starterPrompts: [
      'What went really well this sprint?',
      'What slowed us down the most?',
      'What should we stop doing?',
      'What should we start doing next sprint?',
    ],
  },
  {
    id: 'product-critique',
    name: 'Product Critique',
    description: 'Evaluate a product concept, feature, or design with structured feedback.',
    icon: 'search',
    type: 'product_critique',
    defaultTitle: 'Product Critique',
    contextPrompt: 'Review this product/feature. What works? What\'s missing? What would you change?',
    phaseDurations: { ideation: 15, debate: 20, prioritization: 10, decision: 10 },
    starterPrompts: [
      'What\'s the strongest part of this product?',
      'What would make a user abandon this?',
      'What\'s the one feature that would make this 10x better?',
      'What\'s confusing or hard to understand?',
    ],
  },
  {
    id: 'architecture-decision',
    name: 'Architecture Decision Record',
    description: 'Evaluate technical approaches and make an informed architecture decision.',
    icon: 'git-branch',
    type: 'strategic_decision',
    defaultTitle: 'Architecture Decision',
    contextPrompt: 'We need to choose a technical approach. What are the options, tradeoffs, and risks?',
    phaseDurations: { ideation: 15, debate: 25, prioritization: 15, decision: 10 },
    starterPrompts: [
      'What are the main technical options?',
      'What\'s the biggest risk of each approach?',
      'What can\'t we easily change later?',
      'What do we need to benchmark before deciding?',
    ],
  },
  {
    id: 'post-mortem',
    name: 'Incident Post-Mortem',
    description: 'Analyze what happened, why, and how to prevent it from recurring.',
    icon: 'shield-alert',
    type: 'policy_review',
    defaultTitle: 'Incident Post-Mortem',
    contextPrompt: 'An incident occurred. Let\'s understand what happened without blame. Focus on systems, not people.',
    phaseDurations: { ideation: 15, debate: 20, prioritization: 10, decision: 10 },
    starterPrompts: [
      'What actually happened? (timeline)',
      'What was the root cause?',
      'What existing safeguards failed?',
      'What would have prevented this entirely?',
    ],
  },
  {
    id: 'feature-prioritization',
    name: 'Feature Prioritization',
    description: 'Decide which features to build next based on team input.',
    icon: 'list-ordered',
    type: 'software_planning',
    defaultTitle: 'Feature Prioritization',
    contextPrompt: 'We have limited time. Which features should we build next and why?',
    phaseDurations: { ideation: 10, debate: 15, prioritization: 20, decision: 10 },
    starterPrompts: [
      'What feature would have the most user impact?',
      'What\'s the lowest-effort, highest-value thing we could ship?',
      'What are users actually asking for?',
      'What technical debt is blocking us?',
    ],
  },
  {
    id: 'brainstorm',
    name: 'Open Brainstorm',
    description: 'Free-form idea generation with no constraints.',
    icon: 'lightbulb',
    type: 'brainstorm',
    defaultTitle: '',
    contextPrompt: '',
    phaseDurations: { ideation: 15, debate: 15, prioritization: 10, decision: 10 },
    starterPrompts: [
      'What\'s the craziest idea you have?',
      'What would our competitors never do?',
      'What if we had unlimited budget?',
      'What\'s the simplest version of this?',
    ],
  },
];

export function getTemplate(id: string): ArenaTemplate | undefined {
  return ARENA_TEMPLATES.find((t) => t.id === id);
}
