import type { ContributionType } from '@/types/arena';

/**
 * Fast local classifier using weighted keyword scoring.
 * Runs instantly with zero API cost. Each type has strong signals (high weight)
 * and weak signals (low weight). The type with the highest total score wins.
 */

interface Signal {
  pattern: RegExp;
  weight: number;
}

const TYPE_SIGNALS: Record<ContributionType, Signal[]> = {
  question: [
    { pattern: /\?$/, weight: 5 },
    { pattern: /^(what|how|why|when|where|who|which|can|should|is|are|do|does|could|would)\b/i, weight: 3 },
    { pattern: /\b(wondering|curious|unclear|confused|question|anyone know|thoughts on)\b/i, weight: 3 },
    { pattern: /\b(how do we|what if|is there|are there|can we|should we)\b/i, weight: 2 },
  ],
  blocker: [
    { pattern: /\b(blocker|blocked|showstopper|dealbreaker|cannot proceed)\b/i, weight: 5 },
    { pattern: /\b(critical bug|breaking|crash(es|ing|ed)|fatal|urgent|emergency)\b/i, weight: 4 },
    { pattern: /\b(impossible|blocks? us|can't move forward|must fix first)\b/i, weight: 4 },
    { pattern: /\b(broken|down|outage|incident)\b/i, weight: 2 },
  ],
  risk: [
    { pattern: /\b(risk|risky|danger|dangerous|threat)\b/i, weight: 4 },
    { pattern: /\b(concern(ed|ing)?|worry|worri(ed|some)|afraid)\b/i, weight: 3 },
    { pattern: /\b(might fail|could break|won't scale|too (expensive|slow|complex))\b/i, weight: 4 },
    { pattern: /\b(downside|negative|careful|watch out|beware|fragile)\b/i, weight: 3 },
    { pattern: /\b(costly|expensive|overbudget|over budget|technical debt)\b/i, weight: 3 },
    { pattern: /\b(what if .* goes wrong|single point of failure)\b/i, weight: 4 },
  ],
  benefit: [
    { pattern: /\b(benefit|advantage|strength|upside|pro)\b/i, weight: 4 },
    { pattern: /\b(love|great|excellent|amazing|perfect|awesome)\b/i, weight: 3 },
    { pattern: /\b(saves? (us |time|money|cost))\b/i, weight: 4 },
    { pattern: /\b(faster|easier|simpler|cleaner|more efficient)\b/i, weight: 2 },
    { pattern: /\b(already (works|proven|tested)|battle.tested)\b/i, weight: 3 },
    { pattern: /\b(positive|good thing|strong point|well.designed)\b/i, weight: 3 },
  ],
  feature: [
    { pattern: /\b(we should (add|build|create|make|implement))\b/i, weight: 5 },
    { pattern: /\b(let'?s (add|build|create|make))\b/i, weight: 5 },
    { pattern: /\b(would be (nice|great|cool|useful) (to|if))\b/i, weight: 4 },
    { pattern: /\b(feature request|new feature|add support for)\b/i, weight: 5 },
    { pattern: /\b(how about (adding|building|creating))\b/i, weight: 4 },
    { pattern: /\b(we (could|need to) (add|build|create|integrate))\b/i, weight: 4 },
    { pattern: /\b(suggestion|propose|idea:|i think we should)\b/i, weight: 3 },
  ],
  checklist: [
    { pattern: /\b(make sure|ensure|must have|required|mandatory)\b/i, weight: 4 },
    { pattern: /\b(don'?t forget|remember to|need to verify|check that)\b/i, weight: 4 },
    { pattern: /\b(before (we |launch|deploy|release|ship))\b/i, weight: 4 },
    { pattern: /\b(prerequisite|requirement|compliance|regulation)\b/i, weight: 4 },
    { pattern: /\b(checklist|todo|to.do|action item)\b/i, weight: 5 },
  ],
  decision: [
    { pattern: /\b(we need to decide|decision point|choose between)\b/i, weight: 5 },
    { pattern: /\b(option (a|b|1|2)|either .* or)\b/i, weight: 4 },
    { pattern: /\b(versus|vs\.?)\b/i, weight: 3 },
    { pattern: /\b(should we go with|which (one|approach|option))\b/i, weight: 4 },
    { pattern: /\b(vote on|poll|preference|tradeoff|trade.off)\b/i, weight: 3 },
  ],
  wildcard: [
    { pattern: /\b(random thought|off topic|tangent|unrelated but|crazy idea)\b/i, weight: 5 },
    { pattern: /\b(just thinking|brain dump|wild idea|out there)\b/i, weight: 4 },
    { pattern: /\b(long.term|future|someday|maybe one day|pie in the sky)\b/i, weight: 2 },
  ],
};

export function classifyLocally(content: string): {
  type: ContributionType;
  confidence: number;
} {
  const trimmed = content.trim();

  // Score each type
  const scores: Record<string, number> = {};
  let maxScore = 0;
  let maxType: ContributionType = 'feature';

  for (const [type, signals] of Object.entries(TYPE_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      if (signal.pattern.test(trimmed)) {
        score += signal.weight;
      }
    }
    scores[type] = score;
    if (score > maxScore) {
      maxScore = score;
      maxType = type as ContributionType;
    }
  }

  // If no pattern matched strongly, use sentiment heuristic
  if (maxScore <= 1) {
    const negative = /\b(not|don't|won't|can't|shouldn't|isn't|doesn't|never|no one|nobody|nothing|bad|wrong|broken|terrible|awful|hate|sucks|annoying|frustrat|confus|fail|miss|lack|poor|weak)\b/i;
    const positive = /\b(good|nice|cool|great|like|love|works|helpful|useful|enjoy|happy|glad|sweet|solid)\b/i;

    if (negative.test(trimmed)) {
      return { type: 'risk', confidence: 0.4 };
    }
    if (positive.test(trimmed)) {
      return { type: 'benefit', confidence: 0.4 };
    }
    return { type: 'feature', confidence: 0.2 };
  }

  // Confidence based on how decisive the winner is
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const gap = sortedScores[0] - (sortedScores[1] ?? 0);
  const confidence = Math.min(0.95, 0.4 + gap * 0.1);

  return { type: maxType, confidence };
}
