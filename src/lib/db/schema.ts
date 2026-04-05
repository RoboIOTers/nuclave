import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  varchar,
  pgEnum,
  index,
  uniqueIndex,
  vector,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Enums ──

export const contributionTypeEnum = pgEnum('contribution_type', [
  'benefit',
  'risk',
  'feature',
  'blocker',
  'checklist',
  'question',
  'decision',
  'wildcard',
]);

export const signalTypeEnum = pgEnum('signal_type', [
  'agree',
  'critical',
  'challenge',
]);

export const arenaTypeEnum = pgEnum('arena_type', [
  'software_planning',
  'product_critique',
  'policy_review',
  'strategic_decision',
  'retrospective',
  'brainstorm',
  'custom',
]);

export const arenaModeEnum = pgEnum('arena_mode', ['live', 'async']);

export const arenaPhaseEnum = pgEnum('arena_phase', [
  'ideation',
  'debate',
  'prioritization',
  'decision',
  'closed',
]);

export const arenaStatusEnum = pgEnum('arena_status', [
  'draft',
  'active',
  'paused',
  'closed',
  'archived',
]);

export const participantRoleEnum = pgEnum('participant_role', [
  'facilitator',
  'expert',
  'contributor',
  'observer',
]);

// ── Users ──

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Arenas ──

export const arenas = pgTable(
  'arenas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    type: arenaTypeEnum('type').default('brainstorm').notNull(),
    mode: arenaModeEnum('mode').default('live').notNull(),
    phase: arenaPhaseEnum('phase').default('ideation').notNull(),
    status: arenaStatusEnum('status').default('draft').notNull(),
    isAnonymous: boolean('is_anonymous').default(true).notNull(),
    joinCode: varchar('join_code', { length: 12 }).unique().notNull(),
    contextDocument: text('context_document'),
    maxContributors: integer('max_contributors').default(10),
    phaseTimerMinutes: jsonb('phase_timer_minutes').$type<Record<string, number>>(),
    createdById: uuid('created_by_id')
      .references(() => users.id)
      .notNull(),
    asyncDeadline: timestamp('async_deadline', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('arenas_join_code_idx').on(table.joinCode),
    index('arenas_status_idx').on(table.status),
    index('arenas_created_by_idx').on(table.createdById),
  ]
);

// ── Arena Participants ──

export const arenaParticipants = pgTable(
  'arena_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    arenaId: uuid('arena_id')
      .references(() => arenas.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    role: participantRoleEnum('role').default('contributor').notNull(),
    displayName: text('display_name'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('arena_participant_unique').on(table.arenaId, table.userId),
    index('arena_participants_arena_idx').on(table.arenaId),
  ]
);

// ── Contributions ──

export const contributions = pgTable(
  'contributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    arenaId: uuid('arena_id')
      .references(() => arenas.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: uuid('author_id')
      .references(() => users.id)
      .notNull(),
    type: contributionTypeEnum('type').notNull(),
    content: text('content').notNull(),
    isSkepticAi: boolean('is_skeptic_ai').default(false).notNull(),
    parentContributionId: uuid('parent_contribution_id'),
    clusterId: uuid('cluster_id'),
    consensusScore: integer('consensus_score'),
    embedding: vector('embedding', { dimensions: 1536 }),
    isHidden: boolean('is_hidden').default(false).notNull(),
    isPinned: boolean('is_pinned').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('contributions_arena_idx').on(table.arenaId),
    index('contributions_cluster_idx').on(table.clusterId),
    index('contributions_type_idx').on(table.arenaId, table.type),
  ]
);

// ── Contribution Clusters ──

export const clusters = pgTable(
  'clusters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    arenaId: uuid('arena_id')
      .references(() => arenas.id, { onDelete: 'cascade' })
      .notNull(),
    label: text('label').notNull(),
    summary: text('summary'),
    contributionCount: integer('contribution_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('clusters_arena_idx').on(table.arenaId)]
);

// ── Signals ──

export const signals = pgTable(
  'signals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contributionId: uuid('contribution_id')
      .references(() => contributions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    type: signalTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('signal_unique').on(table.contributionId, table.userId),
    index('signals_contribution_idx').on(table.contributionId),
  ]
);

// ── Arena Summaries ──

export const arenaSummaries = pgTable(
  'arena_summaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    arenaId: uuid('arena_id')
      .references(() => arenas.id, { onDelete: 'cascade' })
      .notNull(),
    phase: arenaPhaseEnum('phase').notNull(),
    consensusItems: jsonb('consensus_items').$type<string[]>().default([]),
    contestedItems: jsonb('contested_items').$type<string[]>().default([]),
    unresolvedQuestions: jsonb('unresolved_questions').$type<string[]>().default([]),
    criticalBlockers: jsonb('critical_blockers').$type<string[]>().default([]),
    topIdeasByType: jsonb('top_ideas_by_type').$type<Record<string, string[]>>().default({}),
    narrativeSummary: text('narrative_summary'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('summaries_arena_idx').on(table.arenaId)]
);

// ── Relations ──

export const usersRelations = relations(users, ({ many }) => ({
  arenas: many(arenas),
  participants: many(arenaParticipants),
  contributions: many(contributions),
  signals: many(signals),
}));

export const arenasRelations = relations(arenas, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [arenas.createdById],
    references: [users.id],
  }),
  participants: many(arenaParticipants),
  contributions: many(contributions),
  clusters: many(clusters),
  summaries: many(arenaSummaries),
}));

export const arenaParticipantsRelations = relations(arenaParticipants, ({ one }) => ({
  arena: one(arenas, {
    fields: [arenaParticipants.arenaId],
    references: [arenas.id],
  }),
  user: one(users, {
    fields: [arenaParticipants.userId],
    references: [users.id],
  }),
}));

export const contributionsRelations = relations(contributions, ({ one, many }) => ({
  arena: one(arenas, {
    fields: [contributions.arenaId],
    references: [arenas.id],
  }),
  author: one(users, {
    fields: [contributions.authorId],
    references: [users.id],
  }),
  cluster: one(clusters, {
    fields: [contributions.clusterId],
    references: [clusters.id],
  }),
  signals: many(signals),
}));

export const clustersRelations = relations(clusters, ({ one, many }) => ({
  arena: one(arenas, {
    fields: [clusters.arenaId],
    references: [arenas.id],
  }),
  contributions: many(contributions),
}));

export const signalsRelations = relations(signals, ({ one }) => ({
  contribution: one(contributions, {
    fields: [signals.contributionId],
    references: [contributions.id],
  }),
  user: one(users, {
    fields: [signals.userId],
    references: [users.id],
  }),
}));

export const arenaSummariesRelations = relations(arenaSummaries, ({ one }) => ({
  arena: one(arenas, {
    fields: [arenaSummaries.arenaId],
    references: [arenas.id],
  }),
}));
