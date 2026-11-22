import { describe, expect, it } from 'vitest';
import { detectCompiler } from '../../../src/core/compiler/CompilerDetector';
import { GCCCompiler } from '../../../src/core/compiler/GCCCompiler';
import { ExecutionService } from '../../../src/core/execution/ExecutionService';
import { createWorkingDirectory, removeWorkingDirectory } from '../../../src/core/execution/ProcessManager';
import { normalizeExecutionConfig } from '../../../src/core/execution/ExecutionConfig';
import { PRACTICALS, getPracticalById, getPracticalCategories } from '../../../src/core/practicals/practicals';
import {
  getPracticalView,
  startPracticalSession,
  completePracticalSession,
} from '../../../src/core/practicals/PracticalExamService';
import { MOCK_EXAMS, buildMockExamResult, marksPerPractical } from '../../../src/core/practicals/MockExamEngine';
import { VIVA_QUESTIONS, getVivaQuestions, pickRandomVivaQuestion } from '../../../src/core/practicals/VivaQuestionService';

const compiler = detectCompiler();
const hasGcc = compiler.available && compiler.verified;

const EXECUTION = normalizeExecutionConfig({
  language: 'c',
  standard: 'c11',
  optimization: 'O0',
  timeoutMs: 20000,
  maxOutputBytes: 256 * 1024,
  debugSymbols: true,
});

describe('practical exercises', () => {
  it('ships the ten university-style practicals', () => {
    expect(PRACTICALS).toHaveLength(10);
  });

  it('gives every practical the full structure of a practical paper', () => {
    for (const practical of PRACTICALS) {
      expect(practical.name.length, practical.id).toBeGreaterThan(0);
      expect(practical.aim.length, practical.id).toBeGreaterThan(20);
      expect(practical.theory.length, practical.id).toBeGreaterThan(40);
      expect(practical.problemStatement.length, practical.id).toBeGreaterThan(3);
      expect(practical.algorithm.length, practical.id).toBeGreaterThan(2);
      expect(practical.pseudocode.length, practical.id).toBeGreaterThan(2);
      expect(practical.cProgram.length, practical.id).toBeGreaterThan(100);
      expect(practical.timeComplexity.length, practical.id).toBeGreaterThan(0);
      expect(practical.spaceComplexity.length, practical.id).toBeGreaterThan(0);
      expect(practical.conclusion.length, practical.id).toBeGreaterThan(20);
      expect(practical.vivaQuestions.length, practical.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('covers every practical category', () => {
    const categories = getPracticalCategories();
    for (const category of [
      'searching',
      'sorting',
      'greedy',
      'divide-and-conquer',
      'dynamic-programming',
      'graph',
      'backtracking',
      'branch-and-bound',
      'string-matching',
    ]) {
      expect(categories).toContain(category);
    }
  });

  it('gives every viva question an expected answer and keywords', () => {
    expect(VIVA_QUESTIONS.length).toBeGreaterThanOrEqual(20);
    for (const question of VIVA_QUESTIONS) {
      expect(question.question.length).toBeGreaterThan(10);
      expect(question.expectedAnswer.length).toBeGreaterThan(30);
      expect(question.keywords.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('filters the viva questions by topic', () => {
    const searching = getVivaQuestions('binary-search');
    expect(searching.length).toBeGreaterThan(0);
    expect(searching.every((question) => question.topic === 'binary-search')).toBe(true);
  });

  it('picks a viva question deterministically', () => {
    expect(pickRandomVivaQuestion(3)?.id).toBe(pickRandomVivaQuestion(3)?.id);
  });

  it('runs every practical program and reproduces its sample output', async () => {
    if (!hasGcc) {
      return;
    }

    const service = new ExecutionService(new GCCCompiler(compiler));
    const failures: string[] = [];

    for (const practical of PRACTICALS) {
      const directory = createWorkingDirectory('daa-practical-test-');
      const compiled = service.compile(
        practical.cProgram,
        {
          compilerPath: null,
          standard: 'c11',
          optimization: 'O0',
          warningLevel: 'basic',
          debugSymbols: true,
          extraArgs: [],
        },
        directory,
        'practical.c'
      );

      if (!compiled.success || !compiled.binaryPath) {
        failures.push(
          `${practical.id}: the program did not compile — ${compiled.diagnostics
            .filter((d) => d.severity === 'error')
            .map((d) => d.message)
            .join('; ')}`
        );
        removeWorkingDirectory(directory);
        continue;
      }

      const result = await service.runBinary(compiled.binaryPath, {
        programId: practical.id,
        execution: EXECUTION,
        stdin: practical.sampleInput,
        cwd: directory,
      });

      const normalize = (text: string): string =>
        text.replace(/\s+/g, ' ').trim();

      if (normalize(result.stdout) !== normalize(practical.sampleOutput)) {
        failures.push(
          `${practical.id}: expected ${JSON.stringify(normalize(practical.sampleOutput))} but got ${JSON.stringify(normalize(result.stdout))}`
        );
      }

      removeWorkingDirectory(directory);
    }

    expect(failures).toEqual([]);
  }, 600000);
});

describe('practical preparation modes', () => {
  it('shows the whole solution in the guided mode', () => {
    const view = getPracticalView('prac-binary-search', 'guided');

    expect(view?.theory).toBeTruthy();
    expect(view?.cProgram).toBeTruthy();
    expect(view?.pseudocode?.length ?? 0).toBeGreaterThan(0);
  });

  it('hides the solution in the independent mode until it is revealed', () => {
    const hidden = getPracticalView('prac-binary-search', 'independent');
    expect(hidden?.cProgram).toBeUndefined();
    expect(hidden?.problemStatement).toBeTruthy();

    const revealed = getPracticalView('prac-binary-search', 'independent', true);
    expect(revealed?.cProgram).toBeTruthy();
  });

  it('starts and completes a practical session', () => {
    const session = startPracticalSession('prac-binary-search', 'guided', 1000);
    expect(session?.status).toBe('in-progress');

    const completed = completePracticalSession(session!, { now: 2000 });
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBe(2000);
  });

  it('returns null for an unknown practical', () => {
    expect(getPracticalView('does-not-exist', 'guided')).toBeNull();
    expect(getPracticalById('does-not-exist')).toBeUndefined();
  });
});

describe('mock examinations', () => {
  it('describes every mock exam with its practicals', () => {
    expect(MOCK_EXAMS.length).toBeGreaterThanOrEqual(3);

    for (const exam of MOCK_EXAMS) {
      expect(exam.practicalIds.length).toBeGreaterThan(0);
      expect(exam.durationSeconds).toBeGreaterThan(0);
      expect(exam.totalMarks).toBeGreaterThan(0);
      expect(exam.passingMarks).toBeLessThan(exam.totalMarks);
      // The mock exam is a practice paper, never presented as an official exam.
      expect(exam.description.toLowerCase()).toContain('practice');
    }
  });

  it('only uses practicals that exist', () => {
    for (const exam of MOCK_EXAMS) {
      for (const practicalId of exam.practicalIds) {
        expect(getPracticalById(practicalId)).toBeDefined();
      }
    }
  });

  it('scores a mock exam by the accepted practicals', () => {
    const exam = MOCK_EXAMS[0];
    const perPractical = marksPerPractical(exam);

    const result = buildMockExamResult(
      exam,
      { [exam.practicalIds[0]]: 'accepted', [exam.practicalIds[1]]: 'wrong-answer' },
      1000,
      2000
    );

    expect(result.score).toBe(perPractical);
    expect(result.maxScore).toBe(exam.totalMarks);
    expect(result.passed).toBe(result.score >= exam.passingMarks);
  });

  it('marks a mock exam as passed when the score is high enough', () => {
    const exam = MOCK_EXAMS[0];
    const results = Object.fromEntries(exam.practicalIds.map((id) => [id, 'accepted' as const]));

    const result = buildMockExamResult(exam, results, 1000, 2000);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(exam.totalMarks);
  });
});
