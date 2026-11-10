export interface RecurrenceAnalysis {
  recurrence: string;
  complexity: string;
  explanation: string;
  assumptions?: string[];
}

export class RecurrenceAnalyzer {
  analyze(
    recurrence: string,
    method: 'master-theorem' | 'substitution' | 'recursion-tree' = 'master-theorem'
  ): RecurrenceAnalysis {
    const analysis = this.parseRecurrence(recurrence);
    if (!analysis) {
      return {
        recurrence,
        complexity: 'O(?)',
        explanation: 'Could not parse recurrence relation.',
      };
    }

    const { a, b, f } = analysis;
    const logBA = Math.log(a) / Math.log(b);
    let complexity: string;
    let explanation: string;

    if (method === 'master-theorem') {
      if (f === 'O(1)' || f === 'O(n^0)') {
        if (logBA > 0) {
          complexity = `O(n^${logBA.toFixed(2)})`;
          explanation = 'Master Theorem Case 1: f(n) = O(n^{log_b(a)-ε}). T(n) = Θ(n^{log_b(a)}).';
        } else {
          complexity = 'O(1)';
          explanation = 'Master Theorem Case 1: T(n) = Θ(n^{log_b(a)}).';
        }
      } else if (f === `O(n^${logBA.toFixed(2)})` || f.includes('n log n')) {
        complexity = `O(n^${logBA.toFixed(2)} log n)`;
        explanation = 'Master Theorem Case 2: f(n) = Θ(n^{log_b(a)} log^k n). T(n) = Θ(n^{log_b(a)} log^{k+1} n).';
      } else if (f.includes('n^') && this.extractExponent(f) > logBA) {
        complexity = f;
        explanation = 'Master Theorem Case 3: f(n) = Ω(n^{log_b(a)+ε}) and regularity condition holds. T(n) = Θ(f(n)).';
      } else {
        complexity = 'O(?)';
        explanation = 'Master Theorem does not apply directly.';
      }
    } else {
      complexity = 'O(?)';
      explanation = 'Substitution and recursion tree methods require manual analysis.';
    }

    return {
      recurrence,
      complexity,
      explanation,
    };
  }

  private parseRecurrence(
    recurrence: string
  ): { a: number; b: number; f: string } | null {
    const trimmed = recurrence.trim();
    const match = trimmed.match(/T\s*\(\s*n\s*\)\s*=\s*(\d+)\s*T\s*\(\s*n\s*\/\s*(\d+)\s*\)\s*\+\s*(.+)$/i);
    if (match) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const f = match[3].trim();
      return { a, b, f };
    }
    return null;
  }

  private extractExponent(f: string): number {
    const match = f.match(/n\^([\d.]+)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  }
}