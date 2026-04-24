import * as z from "zod/v4";

export const brvGitignore = `# Dream state and logs
dream-log/
dream-state.json
dream.lock

# Review backups
review-backups/

# Generated files
config.json
_queue_status.json
.snapshot.json
_manifest.json
_index.md
*.abstract.md
*.overview.md
`;

export const configDefaults = {
  enabled: true,
  brvPath: "brv",
  searchTimeoutMs: 15_000,
  recallTimeoutMs: 15_000,
  persistTimeoutMs: 15_000,
  quiet: false,
  autoRecall: true,
  autoPersist: true,
  contextTagName: "byterover-context",
  recallPrompt:
    `Recall any relevant context that would help answer the latest user message.\n` +
    `Use the recent conversation only to resolve references and intent.\n` +
    `Do not restate the query in your findings.`,
  persistPrompt:
    `The following is a conversation between a user and an AI assistant.\n` +
    `Curate only information with lasting value: facts, decisions, technical details, preferences, or notable outcomes.\n` +
    `Skip trivial messages such as greetings, acknowledgments ("ok", "thanks", "sure", "got it"), one-word replies, anything with no substantive content.`,
  maxRecallTurns: 3,
  maxRecallChars: 4096,
};

export const maxCuratedTurnCacheSize = 500;

export const ConfigSchema = z
  .object({
    enabled: z.boolean().default(configDefaults.enabled),
    // BrvBridge options
    brvPath: z.string().optional().default(configDefaults.brvPath),
    searchTimeoutMs: z.number().default(configDefaults.searchTimeoutMs),
    recallTimeoutMs: z.number().default(configDefaults.recallTimeoutMs),
    persistTimeoutMs: z.number().default(configDefaults.persistTimeoutMs),
    // Plugin options
    quiet: z.boolean().default(configDefaults.quiet),
    autoRecall: z.boolean().default(configDefaults.autoRecall),
    autoPersist: z.boolean().default(configDefaults.autoPersist),
    contextTagName: z.string().default(configDefaults.contextTagName),
    recallPrompt: z.string().default(configDefaults.recallPrompt),
    persistPrompt: z.string().default(configDefaults.persistPrompt),
    maxRecallTurns: z.number().default(configDefaults.maxRecallTurns),
    maxRecallChars: z.number().default(configDefaults.maxRecallChars),
  })
  .optional()
  .default(configDefaults);
