'use strict';

/**
 * Judge Service Tests — Tests code execution for C++, Python, and C.
 *
 * All test cases use Codeforces-style plain stdin/stdout I/O:
 *   - Input: first line = array length, next line = space-separated values
 *   - Output: plain values, no brackets, no commas
 *
 * These tests use DirectRunner (EXECUTION_MODE=direct) and run directly on the host.
 * Prerequisites: g++, python3, gcc must be installed.
 *
 * Run: cd execution-service && npm test -- tests/judge.test.js
 */

const JudgeService = require('../src/services/JudgeService');

describe('JudgeService', () => {
  let judgeService;

  beforeAll(() => {
    // Ensure we use DirectRunner for tests
    process.env.EXECUTION_MODE = 'direct';
    judgeService = new JudgeService();
  });

  // =======================================
  // PYTHON Tests
  // =======================================
  describe('Python Execution', () => {
    test('✅ Accepted — correct output (square of a number)', () => {
      const testCases = [
        { input: '5', expectedOutput: '25' },
        { input: '3', expectedOutput: '9' },
      ];
      const sourceCode = `n = int(input())\nprint(n * n)`;

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
      expect(verdict.totalTestCases).toBe(2);
      expect(verdict.failedTestCase).toBeNull();
      expect(verdict.executionTime).toBeGreaterThanOrEqual(0);
    });

    test('✅ Accepted — sum of array (CF-style I/O)', () => {
      const testCases = [
        { input: '5\n1 2 3 4 5', expectedOutput: '15' },
        { input: '3\n-1 0 1', expectedOutput: '0' },
      ];
      const sourceCode = `n = int(input())\narr = list(map(int, input().split()))\nprint(sum(arr))`;

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
      expect(verdict.totalTestCases).toBe(2);
    });

    test('✅ Accepted — reverse array with space-separated output', () => {
      const testCases = [
        { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' },
        { input: '3\n10 20 30', expectedOutput: '30 20 10' },
      ];
      const sourceCode = `n = int(input())\narr = list(map(int, input().split()))\nprint(*arr[::-1])`;

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
    });

    test('❌ Wrong Answer — incorrect output', () => {
      const testCases = [
        { input: '5', expectedOutput: '25' },
      ];
      const sourceCode = `n = int(input())\nprint(n + n)`;  // adds instead of multiplying

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Wrong Answer');
      expect(verdict.failedTestCase).toBe(1);
      expect(verdict.output).toBe('10');
      expect(verdict.expectedOutput).toBe('25');
    });

    test('❌ Wrong Answer — Python list output instead of space-separated', () => {
      const testCases = [
        { input: '3\n1 2 3', expectedOutput: '3 2 1' },
      ];
      // WRONG: print(arr) outputs [3, 2, 1] instead of "3 2 1"
      const sourceCode = `n = int(input())\narr = list(map(int, input().split()))\nprint(arr[::-1])`;

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Wrong Answer');
    });

    test('💥 Runtime Error — division by zero', () => {
      const testCases = [
        { input: '0', expectedOutput: '0' },
      ];
      const sourceCode = `n = int(input())\nprint(10 // n)`;

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Runtime Error');
      expect(verdict.error).toBeTruthy();
      expect(verdict.error).toContain('ZeroDivisionError');
    });

    test('💥 Runtime Error — syntax error treated as runtime', () => {
      const testCases = [
        { input: '1', expectedOutput: '1' },
      ];
      const sourceCode = `def foo(\n  print("hello")`;  // syntax error

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Runtime Error');
      expect(verdict.error).toBeTruthy();
    });

    test('✅ Accepted — multi-line output', () => {
      const testCases = [
        { input: '3', expectedOutput: '1\n2\n3' },
      ];
      const sourceCode = `n = int(input())\nfor i in range(1, n+1):\n    print(i)`;

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
    });

    test('✅ Accepted — two parameters on one line (CF-style)', () => {
      const testCases = [
        { input: '4 9\n2 7 11 15', expectedOutput: '0 1' },
      ];
      // Two Sum solution
      const sourceCode = `n, target = map(int, input().split())
arr = list(map(int, input().split()))
seen = {}
for i, x in enumerate(arr):
    comp = target - x
    if comp in seen:
        print(seen[comp], i)
        break
    seen[x] = i`;

      const verdict = judgeService.generateVerdict('python', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
    });
  });

  // =======================================
  // C++ Tests
  // =======================================
  describe('C++ Execution', () => {
    test('✅ Accepted — correct output', () => {
      const testCases = [
        { input: '5', expectedOutput: '25' },
        { input: '3', expectedOutput: '9' },
      ];
      const sourceCode = `#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    cout << n * n << endl;
    return 0;
}`;

      const verdict = judgeService.generateVerdict('cpp', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
      expect(verdict.totalTestCases).toBe(2);
      expect(verdict.failedTestCase).toBeNull();
    });

    test('✅ Accepted — sum of array (CF-style I/O)', () => {
      const testCases = [
        { input: '5\n1 2 3 4 5', expectedOutput: '15' },
        { input: '3\n-1 0 1', expectedOutput: '0' },
      ];
      const sourceCode = `#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        sum += x;
    }
    cout << sum << endl;
    return 0;
}`;

      const verdict = judgeService.generateVerdict('cpp', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
      expect(verdict.totalTestCases).toBe(2);
    });

    test('✅ Accepted — space-separated output', () => {
      const testCases = [
        { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' },
      ];
      const sourceCode = `#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    int arr[n];
    for (int i = 0; i < n; i++) cin >> arr[i];
    for (int i = n-1; i >= 0; i--) {
        if (i < n-1) cout << " ";
        cout << arr[i];
    }
    cout << endl;
    return 0;
}`;

      const verdict = judgeService.generateVerdict('cpp', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
    });

    test('❌ Wrong Answer — incorrect output', () => {
      const testCases = [
        { input: '5', expectedOutput: '25' },
      ];
      const sourceCode = `#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    cout << n + n << endl;
    return 0;
}`;

      const verdict = judgeService.generateVerdict('cpp', sourceCode, testCases);

      expect(verdict.status).toBe('Wrong Answer');
      expect(verdict.failedTestCase).toBe(1);
    });

    test('🔧 Compilation Error — syntax error', () => {
      const testCases = [
        { input: '1', expectedOutput: '1' },
      ];
      const sourceCode = `#include <iostream>
int main() {
    cout << "hello"  // missing semicolon and no using namespace
    return 0;
}`;

      const verdict = judgeService.generateVerdict('cpp', sourceCode, testCases);

      expect(verdict.status).toBe('Compilation Error');
      expect(verdict.error).toBeTruthy();
    });

    test('💥 Runtime Error — null pointer dereference', () => {
      const testCases = [
        { input: '1', expectedOutput: '0' },
      ];
      const sourceCode = `#include <iostream>
using namespace std;
int main() {
    int* p = nullptr;
    cout << *p << endl;
    return 0;
}`;

      const verdict = judgeService.generateVerdict('cpp', sourceCode, testCases);

      // On Windows, segfault may produce Wrong Answer (exit code handled differently)
      // On Linux, it produces Runtime Error (signal SIGSEGV)
      expect(['Runtime Error', 'Wrong Answer']).toContain(verdict.status);
    });
  });

  // =======================================
  // C Tests
  // =======================================
  describe('C Execution', () => {
    test('✅ Accepted — correct output', () => {
      const testCases = [
        { input: '5', expectedOutput: '25' },
        { input: '3', expectedOutput: '9' },
      ];
      const sourceCode = `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", n * n);
    return 0;
}`;

      const verdict = judgeService.generateVerdict('c', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
      expect(verdict.totalTestCases).toBe(2);
      expect(verdict.failedTestCase).toBeNull();
    });

    test('✅ Accepted — sum of array (CF-style I/O)', () => {
      const testCases = [
        { input: '5\n1 2 3 4 5', expectedOutput: '15' },
        { input: '3\n-1 0 1', expectedOutput: '0' },
      ];
      const sourceCode = `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%lld\\n", sum);
    return 0;
}`;

      const verdict = judgeService.generateVerdict('c', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
    });

    test('❌ Wrong Answer — incorrect output', () => {
      const testCases = [
        { input: '5', expectedOutput: '25' },
      ];
      const sourceCode = `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", n + n);
    return 0;
}`;

      const verdict = judgeService.generateVerdict('c', sourceCode, testCases);

      expect(verdict.status).toBe('Wrong Answer');
      expect(verdict.failedTestCase).toBe(1);
    });

    test('🔧 Compilation Error — syntax error', () => {
      const testCases = [
        { input: '1', expectedOutput: '1' },
      ];
      const sourceCode = `#include <stdio.h>
int main() {
    printf("hello")  // missing semicolon
    return 0;
}`;

      const verdict = judgeService.generateVerdict('c', sourceCode, testCases);

      expect(verdict.status).toBe('Compilation Error');
      expect(verdict.error).toBeTruthy();
    });

    test('💥 Runtime Error — null pointer dereference', () => {
      const testCases = [
        { input: '1', expectedOutput: '0' },
      ];
      const sourceCode = `#include <stdio.h>
#include <stdlib.h>
int main() {
    int* p = NULL;
    printf("%d\\n", *p);
    return 0;
}`;

      const verdict = judgeService.generateVerdict('c', sourceCode, testCases);

      // On Windows, segfault may produce Wrong Answer; on Linux, Runtime Error
      expect(['Runtime Error', 'Wrong Answer']).toContain(verdict.status);
    });

    test('✅ Accepted — using math library', () => {
      const testCases = [
        { input: '9', expectedOutput: '3' },
      ];
      const sourceCode = `#include <stdio.h>
#include <math.h>
int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", (int)sqrt(n));
    return 0;
}`;

      const verdict = judgeService.generateVerdict('c', sourceCode, testCases);

      expect(verdict.status).toBe('Accepted');
    });
  });

  // =======================================
  // Edge Cases & Comparison Tests
  // =======================================
  describe('Edge Cases', () => {
    test('Empty test cases array should return Accepted', () => {
      const sourceCode = `print("hello")`;
      const verdict = judgeService.generateVerdict('python', sourceCode, []);

      expect(verdict.status).toBe('Accepted');
      expect(verdict.totalTestCases).toBe(0);
    });

    test('Unsupported language should throw error', () => {
      expect(() => {
        judgeService.generateVerdict('ruby', 'puts "hello"', []);
      }).toThrow();
    });

    test('Output normalization — trailing whitespace and newlines', () => {
      expect(judgeService.normalizeOutput('hello  \n  world  \n')).toBe('hello\n  world');
      expect(judgeService.normalizeOutput('hello\r\nworld\r\n')).toBe('hello\nworld');
    });

    test('Token comparison — space vs newline equivalence', () => {
      // "1 2 3" should match "1\n2\n3" via flat token comparison
      expect(judgeService.compareOutput('1 2 3', '1\n2\n3')).toBe(true);
      expect(judgeService.compareOutput('1\n2\n3', '1 2 3')).toBe(true);
    });

    test('Token comparison — brackets should NOT match plain output', () => {
      // After removing bracket stripping, [0,1] should NOT match "0 1"
      expect(judgeService.compareOutput('[0,1]', '0 1')).toBe(false);
      expect(judgeService.compareOutput('[1, 2, 3]', '1 2 3')).toBe(false);
    });

    test('Exact match after normalization', () => {
      expect(judgeService.compareOutput('42', '42')).toBe(true);
      expect(judgeService.compareOutput('42\n', '42')).toBe(true);
      expect(judgeService.compareOutput('  42  ', '42')).toBe(true);
    });
  });
});
