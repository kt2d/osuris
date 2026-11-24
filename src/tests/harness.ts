// ===========================================================================
// Test harness: assert-based test runner (verbatim move from src/main.ts).
// TASK-042: split from the monolithic test suite. The assert/section functions
// and their counters were moved verbatim from src/main.ts; the summary block
// that was top-level code in src/main.ts is now the printSummary() export
// (DEC-042-2 thin entry calls it last; DEC-042-4 requires it as a harness export).
// Counters are module-private (not exported).
// ===========================================================================

let testsPassed = 0;
let testsFailed = 0;

export function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`);
    testsPassed++;
  } else {
    console.log(`  FAIL: ${message}`);
    testsFailed++;
  }
}

export function section(name: string): void {
  console.log(`\n=== ${name} ===`);
}

export function printSummary(): void {
  console.log('\n\n========== TEST SUMMARY ==========');
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\nAll tests PASSED.');
  } else {
    console.log(`\n${testsFailed} test(s) FAILED.`);
    throw new Error(`${testsFailed} test(s) failed`);
  }
}
