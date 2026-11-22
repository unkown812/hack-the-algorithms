import type { TestCase } from '../playground/types';

/**
 * In-memory registry of test cases for one program.
 *
 * Persistence is handled by the extension host (workspace state); this class
 * only owns the data and the validation rules.
 */

export interface TestCaseValidation {
  valid: boolean;
  error?: string;
}

export class TestCaseRegistry {
  private cases = new Map<string, TestCase>();

  constructor(initial: TestCase[] = []) {
    for (const testCase of initial) {
      this.cases.set(testCase.id, testCase);
    }
  }

  list(): TestCase[] {
    return [...this.cases.values()];
  }

  get(id: string): TestCase | undefined {
    return this.cases.get(id);
  }

  /** Adds a test case; the id is generated when missing. */
  add(testCase: Omit<TestCase, 'id'> & { id?: string }): TestCase {
    const validation = validateTestCase(testCase);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid test case');
    }

    const id = testCase.id ?? `test-${Date.now().toString(36)}-${this.cases.size + 1}`;
    const created: TestCase = {
      id,
      name: testCase.name.trim() || `Test ${this.cases.size + 1}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      comparisonMode: testCase.comparisonMode,
      description: testCase.description,
      numericTolerance: testCase.numericTolerance,
    };

    this.cases.set(id, created);
    return created;
  }

  update(id: string, changes: Partial<Omit<TestCase, 'id'>>): TestCase | undefined {
    const existing = this.cases.get(id);
    if (!existing) {
      return undefined;
    }

    const merged: TestCase = { ...existing, ...changes, id };
    const validation = validateTestCase(merged);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid test case');
    }

    this.cases.set(id, merged);
    return merged;
  }

  delete(id: string): boolean {
    return this.cases.delete(id);
  }

  clear(): void {
    this.cases.clear();
  }

  get size(): number {
    return this.cases.size;
  }
}

/** Validates the fields of a test case. */
export function validateTestCase(testCase: Partial<TestCase>): TestCaseValidation {
  if (testCase.name !== undefined && testCase.name.trim() === '') {
    return { valid: false, error: 'A test case needs a name.' };
  }

  if (testCase.input !== undefined && typeof testCase.input !== 'string') {
    return { valid: false, error: 'The test input must be text.' };
  }

  if (testCase.expectedOutput !== undefined && typeof testCase.expectedOutput !== 'string') {
    return { valid: false, error: 'The expected output must be text.' };
  }

  if (
    testCase.comparisonMode !== undefined &&
    !['exact', 'normalized', 'numeric'].includes(testCase.comparisonMode)
  ) {
    return { valid: false, error: `Unknown comparison mode "${testCase.comparisonMode}".` };
  }

  if (
    testCase.numericTolerance !== undefined &&
    (!Number.isFinite(testCase.numericTolerance) || testCase.numericTolerance < 0)
  ) {
    return { valid: false, error: 'The numeric tolerance must be a non-negative number.' };
  }

  return { valid: true };
}
