import { LEARNING_DATA_VERSION, normalizeLearningData } from './LearningDataStore';
import type { LearningData } from '../practice/types';

/**
 * Migrates stored learning data to the current schema version.
 *
 * The migration is additive and forgiving: a data set that is missing fields
 * is completed with the defaults, and a data set from a newer version is kept
 * as it is (the extension never destroys data it does not understand).
 */

export interface MigrationResult {
  data: LearningData;
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
  notes: string[];
}

/** The individual migration steps, applied in order. */
const MIGRATIONS: Array<{ to: number; apply: (data: LearningData, notes: string[]) => void }> = [
  {
    to: 1,
    apply: (data, notes) => {
      // Version 1 is the first released schema — nothing to change, but the
      // step documents that older, unversioned data becomes version 1.
      if (!data.statistics) {
        notes.push('Created missing learning statistics.');
      }
    },
  },
];

export function migrateLearningData(stored: unknown): MigrationResult {
  const notes: string[] = [];
  const data = normalizeLearningData(stored);
  const fromVersion = typeof data.version === 'number' ? data.version : 0;

  if (fromVersion > LEARNING_DATA_VERSION) {
    return {
      data,
      migrated: false,
      fromVersion,
      toVersion: LEARNING_DATA_VERSION,
      notes: [
        'The stored data was written by a newer version of the extension and was left untouched.',
      ],
    };
  }

  let version = fromVersion;
  for (const migration of MIGRATIONS) {
    if (version < migration.to) {
      migration.apply(data, notes);
      version = migration.to;
      data.version = version;
      notes.push(`Migrated the data from version ${fromVersion} to version ${migration.to}.`);
    }
  }

  data.version = LEARNING_DATA_VERSION;

  return {
    data,
    migrated: fromVersion !== LEARNING_DATA_VERSION,
    fromVersion,
    toVersion: LEARNING_DATA_VERSION,
    notes,
  };
}
