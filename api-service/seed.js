/**
 * Seed script — loads demo users and problems into the OJ system.
 *
 * Usage:
 *   node seed.js
 *
 * Configure the URIs below before running:
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ─── CONFIGURE THESE ───────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000';          // api-service base URL
const PROBLEMS_FILE = '../sample_problems.json';     // path to your problems JSON file
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Demo users to create.
 * Passwords are set to "Password@123" for all seed users.
 */
const DEMO_USERS = [
  { username: 'alice_dev',   email: 'alice@demo.com',   password: 'Password@123', role: 'student' },
  { username: 'bob_coder',   email: 'bob@demo.com',     password: 'Password@123', role: 'student' },
  { username: 'charlie_ps',  email: 'charlie@demo.com', password: 'Password@123', role: 'problem_setter' },
  { username: 'diana_admin', email: 'diana@demo.com',   password: 'Password@123', role: 'admin' },
  { username: 'eve_learner', email: 'eve@demo.com',     password: 'Password@123', role: 'student' },
];

/**
 * Built-in sample problems (used if PROBLEMS_FILE is not found).
 */
const SAMPLE_PROBLEMS = [
  {
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    difficulty: 'Easy',
    tags: ['array', 'hash-map'],
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    testCases: [
      { input: '4\n2 7 11 15\n9',  expectedOutput: '0 1' },
      { input: '3\n3 2 4\n6',      expectedOutput: '1 2' },
      { input: '2\n3 3\n6',        expectedOutput: '0 1' },
    ],
    boilerplateCode: {
      cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    // read n, array, target\n    return 0;\n}',
      python: 'def two_sum(nums, target):\n    pass\n',
      java: 'import java.util.*;\npublic class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}',
    },
  },
  {
    title: 'Reverse a String',
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.`,
    difficulty: 'Easy',
    tags: ['string', 'two-pointer'],
    constraints: '1 <= s.length <= 10^5\ns[i] is a printable ASCII character',
    testCases: [
      { input: 'hello',   expectedOutput: 'olleh' },
      { input: 'Hannah',  expectedOutput: 'hannaH' },
    ],
    boilerplateCode: {
      cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    string s; cin >> s;\n    // reverse s\n    cout << s;\n    return 0;\n}',
      python: 's = input()\nprint(s[::-1])',
      java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        System.out.println(new StringBuilder(s).reverse());\n    }\n}',
    },
  },
  {
    title: 'Fibonacci Number',
    description: `The Fibonacci numbers form a sequence defined as:\n- F(0) = 0\n- F(1) = 1\n- F(n) = F(n-1) + F(n-2) for n > 1\n\nGiven \`n\`, return \`F(n)\`.`,
    difficulty: 'Easy',
    tags: ['math', 'dynamic-programming', 'recursion'],
    constraints: '0 <= n <= 30',
    testCases: [
      { input: '2',  expectedOutput: '1' },
      { input: '3',  expectedOutput: '2' },
      { input: '10', expectedOutput: '55' },
    ],
    boilerplateCode: {
      cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint fib(int n){\n    // implement\n    return 0;\n}\nint main(){\n    int n; cin >> n;\n    cout << fib(n);\n    return 0;\n}',
      python: 'def fib(n):\n    pass\nn = int(input())\nprint(fib(n))',
      java: 'import java.util.*;\npublic class Main {\n    static int fib(int n) { return n <= 1 ? n : fib(n-1)+fib(n-2); }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(fib(sc.nextInt()));\n    }\n}',
    },
  },
  {
    title: 'Longest Common Subsequence',
    description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.`,
    difficulty: 'Medium',
    tags: ['dynamic-programming', 'string'],
    constraints: '1 <= text1.length, text2.length <= 1000\ntext1 and text2 consist of only lowercase English characters.',
    testCases: [
      { input: 'abcde\nace',  expectedOutput: '3' },
      { input: 'abc\nabc',   expectedOutput: '3' },
      { input: 'abc\ndef',   expectedOutput: '0' },
    ],
    boilerplateCode: {
      cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    string a, b;\n    cin >> a >> b;\n    int m=a.size(), n=b.size();\n    // dp\n    return 0;\n}',
      python: 'a = input()\nb = input()\n# implement LCS\nprint(0)',
      java: '',
    },
  },
  {
    title: 'Merge Intervals',
    description: `Given an array of intervals where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    difficulty: 'Medium',
    tags: ['array', 'sorting', 'greedy'],
    constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4',
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '[1,6] [8,10] [15,18]' },
      { input: '2\n1 4\n4 5',              expectedOutput: '[1,5]' },
    ],
    boilerplateCode: {
      cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    int n; cin >> n;\n    vector<pair<int,int>> v(n);\n    for(auto& p : v) cin >> p.first >> p.second;\n    // merge\n    return 0;\n}',
      python: 'n = int(input())\nintervals = [list(map(int, input().split())) for _ in range(n)]\n# merge intervals',
      java: '',
    },
  },
  {
    title: 'N-Queens',
    description: `The n-queens puzzle is the problem of placing \`n\` queens on an \`n x n\` chessboard such that no two queens attack each other.\n\nGiven an integer \`n\`, return the number of distinct solutions to the n-queens puzzle.`,
    difficulty: 'Hard',
    tags: ['backtracking', 'recursion'],
    constraints: '1 <= n <= 9',
    testCases: [
      { input: '4', expectedOutput: '2' },
      { input: '1', expectedOutput: '1' },
    ],
    boilerplateCode: {
      cpp: '#include<bits/stdc++.h>\nusing namespace std;\nint count = 0;\nvoid solve(int row, int n, vector<int>& cols, vector<int>& d1, vector<int>& d2){\n    if(row == n){ count++; return; }\n    // backtrack\n}\nint main(){\n    int n; cin >> n;\n    vector<int> cols(n,0), d1(2*n,0), d2(2*n,0);\n    solve(0, n, cols, d1, d2);\n    cout << count;\n}',
      python: 'n = int(input())\n# solve N-Queens\nprint(0)',
      java: '',
    },
  },
];

async function signupUser(user) {
  try {
    const res = await axios.post(`${API_URL}/api/auth/register`, {
      username: user.username,
      email: user.email,
      password: user.password,
    });
    console.log(`  ✓ Signed up: ${user.username} (${user.email})`);
    return res.data.data?.token || null;
  } catch (err) {
    if (err.response?.status === 409 || err.response?.data?.message?.includes('already')) {
      console.log(`  ~ Already exists: ${user.username}`);
      // Try logging in to get token
      try {
        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
          email: user.email,
          password: user.password,
        });
        return loginRes.data.data?.token || null;
      } catch {
        return null;
      }
    }
    console.error(`  ✗ Failed to sign up ${user.username}:`, err.response?.data?.message || err.message);
    return null;
  }
}

async function createProblem(problem, token) {
  try {
    await axios.post(
      `${API_URL}/api/problems`,
      problem,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`  ✓ Created problem: ${problem.title}`);
  } catch (err) {
    if (err.response?.data?.message?.includes('duplicate') || err.response?.status === 409) {
      console.log(`  ~ Already exists: ${problem.title}`);
    } else {
      console.error(`  ✗ Failed to create "${problem.title}":`, err.response?.data?.message || err.message);
    }
  }
}

async function main() {
  console.log('=== OJ Seed Script ===\n');
  console.log(`API: ${API_URL}\n`);

  // Step 1: Create demo users
  console.log('── Creating demo users ──');
  let adminToken = null;
  let problemSetterToken = null;

  for (const user of DEMO_USERS) {
    const token = await signupUser(user);
    if (user.role === 'admin' && token) adminToken = token;
    if (user.role === 'problem_setter' && token) problemSetterToken = token;
  }

  // Step 2: Load problems
  console.log('\n── Loading problems ──');
  let problems = SAMPLE_PROBLEMS;

  if (fs.existsSync(PROBLEMS_FILE)) {
    try {
      const raw = fs.readFileSync(path.resolve(PROBLEMS_FILE), 'utf-8');
      const parsed = JSON.parse(raw);
      problems = Array.isArray(parsed) ? parsed : (parsed.problems || SAMPLE_PROBLEMS);
      console.log(`  Loaded ${problems.length} problems from ${PROBLEMS_FILE}`);
    } catch (err) {
      console.warn(`  Could not parse ${PROBLEMS_FILE}, using built-in samples.`);
    }
  } else {
    console.log(`  ${PROBLEMS_FILE} not found — using ${SAMPLE_PROBLEMS.length} built-in sample problems.`);
  }

  // Use problem_setter token if available, otherwise admin
  const creatorToken = problemSetterToken || adminToken;
  if (!creatorToken) {
    console.error('\n✗ No admin/problem_setter token available. Cannot create problems.');
    console.error('  Make sure charlie@demo.com or diana@demo.com signed up successfully.');
    process.exit(1);
  }

  for (const problem of problems) {
    await createProblem(problem, creatorToken);
  }

  console.log('\n=== Seed complete ===');
  console.log('Demo credentials (password: Password@123):');
  DEMO_USERS.forEach(u => console.log(`  ${u.role.padEnd(15)} ${u.email}`));
}

main().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
