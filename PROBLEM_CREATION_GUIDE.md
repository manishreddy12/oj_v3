# Problem Creation & Testing Guide — Online Judge Platform

This guide covers everything you need to know about creating problems, writing test cases, and testing contests on this Online Judge platform. The platform uses **Codeforces-style I/O** (stdin/stdout), not LeetCode-style function calls.

---

## Table of Contents

1. [I/O Convention (Codeforces-Style)](#1-io-convention-codeforces-style)
2. [How Input/Output Works](#2-how-inputoutput-works)
3. [Creating a Problem — Step by Step](#3-creating-a-problem--step-by-step)
4. [Writing Test Cases](#4-writing-test-cases)
5. [Writing Boilerplate Code](#5-writing-boilerplate-code)
6. [Sample Problem Walkthroughs](#6-sample-problem-walkthroughs)
7. [Common Mistakes to Avoid](#7-common-mistakes-to-avoid)
8. [Testing Contests — End to End](#8-testing-contests--end-to-end)
9. [API Reference for Problem & Contest Management](#9-api-reference-for-problem--contest-management)
10. [Loading Sample Problems via API](#10-loading-sample-problems-via-api)

---

## 1. I/O Convention (Codeforces-Style)

### The Rule

All problems on this platform follow **Codeforces-style I/O**:

- **Input** is read from **stdin** (standard input)
- **Output** is printed to **stdout** (standard output)
- Values are **plain text** — no brackets `[]`, no parentheses `()`, no JSON
- Arrays are provided as: **first line = length**, **next line = space-separated values**

### ✅ Correct I/O Format

```
Input:                    Output:
4                         10
1 2 3 4
```

### ❌ Wrong I/O Format (DO NOT USE)

```
Input:                    Output:
[1, 2, 3, 4]             [10]
```

### Why?

- **Language-agnostic**: C++, Python, C, Java all read from stdin the same way
- **No parsing ambiguity**: `cin >> n` in C++ and `input()` in Python work naturally
- **No formatting issues**: No need to strip brackets from Python's `print(list)`
- **Industry standard**: Codeforces, CodeChef, AtCoder, SPOJ all use this format

---

## 2. How Input/Output Works

### For the Problem Setter (You)

When you create a problem, you provide test cases as JSON objects with two fields:

```json
{
  "input": "4\n1 2 3 4",
  "expectedOutput": "10"
}
```

- `input` — What gets fed to the user's program via stdin
- `expectedOutput` — What the program should print to stdout
- Use `\n` for newlines within the string

### For the Solver (User)

The user writes code that reads from stdin and prints to stdout:

**Python:**
```python
n = int(input())
arr = list(map(int, input().split()))
print(sum(arr))
```

**C++:**
```cpp
#include <iostream>
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
}
```

**C:**
```c
#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%lld\n", sum);
    return 0;
}
```

### How the Judge Compares Output

The execution service:
1. Runs the user's code with the test case `input` piped to stdin
2. Captures stdout
3. Compares the captured output against `expectedOutput`
4. **Normalization**: Trims trailing whitespace, normalizes `\r\n` to `\n`
5. **Token comparison**: If exact match fails, it compares whitespace-separated tokens (so `"1 2 3"` matches `"1\n2\n3"`)

---

## 3. Creating a Problem — Step by Step

### Via the Frontend (Create Problem page)

1. **Login** as a `problem_setter` or `admin`
2. Navigate to **Create Problem** page
3. Fill in the fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Title** | Unique problem name | `Sum of Array` |
| **Description** | Problem statement with I/O format explained | See below |
| **Difficulty** | `Easy`, `Medium`, or `Hard` | `Easy` |
| **Tags** | Comma-separated categories | `array, math, implementation` |
| **Constraints** | Value ranges | `1 <= N <= 10^5` |
| **Test Cases** | JSON objects (see section 4) | See below |
| **Boilerplate** | Starter code for each language | See section 5 |

### Writing a Good Description

Always include these sections in your description:

```
Given an array of N integers, find the sum of all elements.

Input:
The first line contains a single integer N — the number of elements.
The second line contains N space-separated integers a1, a2, ..., aN.

Output:
Print a single integer — the sum of all elements in the array.
```

**Key points:**
- Explain what each line of input contains
- Specify the exact output format
- Use "space-separated" and "each on a new line" to describe formatting
- Always mention 0-indexed or 1-indexed for array problems

---

## 4. Writing Test Cases

### JSON Format

Each test case is a JSON object:

```json
{
  "input": "...",
  "expectedOutput": "...",
  "isHidden": false
}
```

- `isHidden: false` — Shown to users as examples
- `isHidden: true` — Used for judging only (not visible to users)

### Input Format Rules

| Scenario | Input Format | Example |
|----------|-------------|---------|
| Single integer | Just the number | `"5"` |
| Array of integers | Line 1: length, Line 2: space-separated values | `"5\n1 2 3 4 5"` |
| Two parameters + array | Line 1: params, Line 2: array | `"4 9\n2 7 11 15"` |
| Multiple arrays | Length + values for each | `"3\n1 2 3\n3\n4 5 6"` |
| String input | Just the string | `"hello world"` |
| Multiple queries | First line: count, then one per line | `"3\n5\n2\n9"` |
| Matrix (2D array) | Rows & cols, then row per line | `"2 3\n1 2 3\n4 5 6"` |

### Output Format Rules

| Scenario | Output Format | Example |
|----------|--------------|---------|
| Single number | Just the number | `"42"` |
| Two numbers | Space-separated | `"0 1"` |
| Array result | Space-separated on one line | `"5 4 3 2 1"` |
| Multiple answers | Each on a new line | `"2\n-1\n4"` |
| Yes/No | Plain text | `"YES"` or `"NO"` |
| Matrix output | One row per line, space-separated | `"1 2 3\n4 5 6"` |

### ❌ NEVER Use These in Test Cases

```json
// WRONG - array brackets in output
{ "input": "[1,2,3]", "expectedOutput": "[3,2,1]" }

// WRONG - Python list syntax
{ "input": "1 2 3", "expectedOutput": "[3, 2, 1]" }

// WRONG - comma-separated output
{ "input": "3\n1 2 3", "expectedOutput": "3,2,1" }

// WRONG - no array length in input
{ "input": "1 2 3 4 5", "expectedOutput": "15" }
```

### ✅ Correct Test Cases

```json
// CORRECT - plain I/O
{ "input": "3\n1 2 3", "expectedOutput": "3 2 1" }

// CORRECT - single value output
{ "input": "5\n1 2 3 4 5", "expectedOutput": "15" }

// CORRECT - multiline output
{ "input": "5 3\n1 3 5 7 9\n5\n2\n9", "expectedOutput": "2\n-1\n4" }
```

### How Many Test Cases?

- **2-3 visible** (examples for the user to understand the problem)
- **3-5 hidden** (edge cases for thorough judging)

Include these edge cases:
- **Minimum input** (N=1)
- **Maximum input** (largest allowed values)
- **All same elements**
- **Negative numbers**
- **Zero values**
- **Already sorted / reverse sorted**

---

## 5. Writing Boilerplate Code

Boilerplate code gives users a starting template. It should:
- Include necessary imports/headers
- Set up I/O reading structure
- Have placeholder comments where the logic goes
- **NOT solve the problem**

### C++ Template

```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // Read array and solve
    
    return 0;
}
```

### Python Template

```python
n = int(input())
arr = list(map(int, input().split()))
# Solve and print the answer
```

### C Template

```c
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    // Read array and solve
    
    return 0;
}
```

### Python I/O Cheatsheet (for problem solvers)

```python
# Read single integer
n = int(input())

# Read multiple integers on one line
a, b = map(int, input().split())

# Read array of integers
arr = list(map(int, input().split()))

# Read string
s = input()

# Print single value
print(42)

# Print space-separated values
print(*arr)                    # prints: 1 2 3 4 5
print(' '.join(map(str, arr))) # same result

# Print each on new line
for x in arr:
    print(x)

# ❌ WRONG — don't do this:
print(arr)       # prints: [1, 2, 3, 4, 5]  ← WRONG!
print(list(arr)) # prints: [1, 2, 3, 4, 5]  ← WRONG!
```

### C++ I/O Cheatsheet (for problem solvers)

```cpp
// Read single integer
int n;
cin >> n;

// Read multiple integers
int a, b;
cin >> a >> b;

// Read array
int arr[n];
for (int i = 0; i < n; i++) cin >> arr[i];

// Print single value
cout << 42 << endl;

// Print space-separated values
for (int i = 0; i < n; i++) {
    if (i > 0) cout << " ";
    cout << arr[i];
}
cout << endl;

// Print each on new line
for (int i = 0; i < n; i++) {
    cout << arr[i] << endl;
}
```

---

## 6. Sample Problem Walkthroughs

### Problem: "Two Sum" (CF-Style)

**Description:**
```
Given an array of N integers and a target value T, find two distinct indices
i and j such that arr[i] + arr[j] = T.

Input:
The first line contains two integers N and T.
The second line contains N space-separated integers.

Output:
Print two space-separated integers — the indices i and j (0-indexed, i < j).
```

**Test Case JSON:**
```json
{
  "input": "4 9\n2 7 11 15",
  "expectedOutput": "0 1",
  "isHidden": false
}
```

**Correct Solution (Python):**
```python
n, target = map(int, input().split())
arr = list(map(int, input().split()))

seen = {}
for i, x in enumerate(arr):
    complement = target - x
    if complement in seen:
        print(seen[complement], i)
        break
    seen[x] = i
```

**Correct Solution (C++):**
```cpp
#include <iostream>
#include <unordered_map>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    
    int arr[n];
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int complement = target - arr[i];
        if (seen.count(complement)) {
            cout << seen[complement] << " " << i << endl;
            return 0;
        }
        seen[arr[i]] = i;
    }
    return 0;
}
```

Notice:
- Input: `4 9\n2 7 11 15` (NOT `[2,7,11,15]` or `target=9, nums=[2,7,11,15]`)
- Output: `0 1` (NOT `[0, 1]` or `(0, 1)`)

---

## 7. Common Mistakes to Avoid

### ❌ Mistake 1: Array-Style Output in Python

```python
# WRONG
arr = [5, 4, 3, 2, 1]
print(arr)          # Output: [5, 4, 3, 2, 1]  ← WILL FAIL

# CORRECT
print(*arr)         # Output: 5 4 3 2 1  ← ACCEPTED
print(' '.join(map(str, arr)))  # Same result
```

### ❌ Mistake 2: No Array Length in Input

```json
// WRONG — how does the solver know when the array ends?
{ "input": "1 2 3 4 5", "expectedOutput": "15" }

// CORRECT — first line tells the length
{ "input": "5\n1 2 3 4 5", "expectedOutput": "15" }
```

### ❌ Mistake 3: Brackets in Expected Output

```json
// WRONG
{ "expectedOutput": "[0, 1]" }

// CORRECT
{ "expectedOutput": "0 1" }
```

### ❌ Mistake 4: Extra Spaces or Missing Newlines

```json
// WRONG — trailing space
{ "expectedOutput": "1 2 3 " }

// WRONG — no newline between multi-line output
{ "expectedOutput": "12-14" }

// CORRECT
{ "expectedOutput": "1 2 3" }
{ "expectedOutput": "1\n2\n-1\n4" }
```

### ❌ Mistake 5: Using Comma Separation in Output

```json
// WRONG
{ "expectedOutput": "1,2,3" }

// CORRECT
{ "expectedOutput": "1 2 3" }
```

---

## 8. Testing Contests — End to End

### Step 1: Create Problems First

Before creating a contest, you need problems. Use the **Create Problem** page or API to create at least 2-3 problems with proper Codeforces-style test cases.

You can also use the provided `sample_problems.json` file to bulk-load problems (see Section 10).

### Step 2: Create a Contest

**Via Frontend** (Navigate to Create Contest page):
1. Fill in contest **title** and **description**
2. Set **start time** and **end time**
   - For testing, set start time to a few minutes from now
   - Set end time to 1-2 hours later
3. Optionally set **registration deadline** (before start time)
4. Select **problems** to include (from existing problems)
5. Set **isPublic** to `true` for anyone to join
6. Click **Create Contest**

**Via API** (using Postman/curl):
```bash
POST http://localhost:3000/api/contests
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Test Contest #1",
  "description": "A test contest with easy problems",
  "startTime": "2026-04-25T10:00:00Z",
  "endTime": "2026-04-25T12:00:00Z",
  "registrationDeadline": "2026-04-25T09:55:00Z",
  "problems": ["<problem_id_1>", "<problem_id_2>", "<problem_id_3>"],
  "isPublic": true
}
```

### Step 3: Register for the Contest

**Via Frontend**: Navigate to the contest page and click **Register**.

**Via API**:
```bash
POST http://localhost:3000/api/contests/<contest_id>/register
Authorization: Bearer <user_token>
```

### Step 4: Solve Problems During Contest

1. Navigate to the contest detail page
2. Click on a problem to open the OJ Layout (code editor)
3. Write your solution following Codeforces-style I/O
4. Click **Run** to test against the first test case
5. Click **Submit** to judge against all test cases
6. Check the **Verdict** tab for results:
   - ✅ **Accepted** — All test cases passed
   - ❌ **Wrong Answer** — Output doesn't match expected
   - 💥 **Runtime Error** — Code crashed
   - 🔧 **Compilation Error** — Code won't compile (C/C++)
   - ⏱️ **Time Limit Exceeded** — Code too slow

### Step 5: View Leaderboard

**During contest**: Only admin can see the leaderboard.

**After contest ends**:
1. Admin publishes rankings:
   ```bash
   PUT http://localhost:3000/api/contests/<contest_id>/publish-rankings
   Authorization: Bearer <admin_token>
   ```
2. All users can now view the leaderboard via the contest page

### Step 6: Testing Checklist

Use this checklist to verify everything works:

- [ ] Problem created with proper Codeforces-style I/O
- [ ] Test cases have visible examples (isHidden: false)
- [ ] Test cases have hidden edge cases (isHidden: true)
- [ ] Boilerplate code provided for at least C++ and Python
- [ ] Contest created with correct start/end times
- [ ] Registration works for users
- [ ] Problems accessible during contest time window
- [ ] Submit code → Accepted for correct solution
- [ ] Submit code → Wrong Answer for incorrect solution
- [ ] Submit code → Compilation Error for bad C++ code
- [ ] Submit code → Runtime Error for crashing code
- [ ] Leaderboard shows after admin publishes rankings
- [ ] Submissions table shows user's past submissions

---

## 9. API Reference for Problem & Contest Management

### Problems API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/problems` | Admin/Setter | Create a problem |
| `GET` | `/api/problems` | Any | List problems (paginated) |
| `GET` | `/api/problems/:id` | Any | Get problem by ID |
| `PUT` | `/api/problems/:id` | Admin | Update problem |
| `DELETE` | `/api/problems/:id` | Admin | Delete problem |

### Contests API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/contests` | Admin | Create a contest |
| `GET` | `/api/contests` | Any | List all contests |
| `GET` | `/api/contests/:id` | Any | Get contest details |
| `POST` | `/api/contests/:id/register` | User | Register for contest |
| `GET` | `/api/contests/:id/leaderboard` | Any* | View leaderboard |
| `PUT` | `/api/contests/:id/publish-rankings` | Admin | Publish rankings |
| `DELETE` | `/api/contests/:id` | Admin | Delete contest |

### Submissions API (Execution Service)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/submissions` | Any | Submit code for judging |
| `GET` | `/api/submissions/:id` | Any | Get submission status |
| `GET` | `/api/submissions/user/:userId` | Any | Get user's submissions |
| `GET` | `/api/submissions/problem/:problemId` | Any | Get problem submissions |

---

## 10. Loading Sample Problems via API

The `sample_problems.json` file in the project root contains 5 ready-to-use problems. You can load them into the database using a script or curl.

### Using curl (one at a time)

```bash
# Get your admin token first by logging in
TOKEN="your_jwt_token_here"
API_URL="http://localhost:3000"

# Create "Sum of Array" problem
curl -X POST "$API_URL/api/problems" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sum of Array",
    "description": "Given an array of N integers, find the sum of all elements.\n\nInput:\nThe first line contains a single integer N — the number of elements.\nThe second line contains N space-separated integers a1, a2, ..., aN.\n\nOutput:\nPrint a single integer — the sum of all elements in the array.",
    "difficulty": "Easy",
    "tags": ["array", "math", "implementation"],
    "constraints": "1 <= N <= 10^5\n-10^9 <= ai <= 10^9",
    "testCases": [
      {"input": "5\n1 2 3 4 5", "expectedOutput": "15", "isHidden": false},
      {"input": "3\n-1 0 1", "expectedOutput": "0", "isHidden": false},
      {"input": "1\n42", "expectedOutput": "42", "isHidden": true},
      {"input": "4\n1000000000 1000000000 1000000000 1000000000", "expectedOutput": "4000000000", "isHidden": true}
    ],
    "boilerplateCode": {
      "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    cin >> n;\n    // Read the array and compute the sum\n    \n    return 0;\n}",
      "python": "n = int(input())\narr = list(map(int, input().split()))\n# Compute and print the sum\n"
    }
  }'
```

### Using a Node.js Script

Create a file `load_problems.js` in the project root and run it:

```javascript
const fs = require('fs');
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TOKEN = 'your_jwt_token_here'; // Admin JWT token

async function loadProblems() {
  const problems = JSON.parse(fs.readFileSync('sample_problems.json', 'utf-8'));

  for (const problem of problems) {
    try {
      const res = await axios.post(`${API_URL}/api/problems`, problem, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log(`✅ Created: ${problem.title}`);
    } catch (err) {
      console.error(`❌ Failed: ${problem.title} — ${err.response?.data?.message || err.message}`);
    }
  }
}

loadProblems();
```

Run with:
```bash
node load_problems.js
```

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────────────────┐
│                  CODEFORCES-STYLE I/O RULES                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT FORMAT:                                               │
│    Line 1: Array length (N) and/or other params              │
│    Line 2: N space-separated values                          │
│    Line 3+: Additional data (queries, etc.)                  │
│                                                              │
│  OUTPUT FORMAT:                                              │
│    Single value:     42                                      │
│    Multiple values:  0 1  (space-separated)                  │
│    Multiple lines:   One answer per line                     │
│                                                              │
│  ❌ NEVER USE:                                               │
│    [1, 2, 3]    (0, 1)    {answer: 42}    1,2,3             │
│                                                              │
│  PYTHON TIPS:                                                │
│    print(*arr)         ← prints space-separated              │
│    print(arr)          ← WRONG! prints [1, 2, 3]            │
│                                                              │
│  C++ TIPS:                                                   │
│    cout << x << " ";   ← space-separated                    │
│    cout << x << endl;  ← one per line                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
