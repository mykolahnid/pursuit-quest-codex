import assert from "node:assert/strict";
import test from "node:test";

import { pearsonCorrelationSignificance } from "./stats.ts";

function assertApprox(actual: number, expected: number, tolerance: number, label: string): void {
  const delta = Math.abs(actual - expected);
  assert.ok(
    delta <= tolerance,
    `${label} expected ${expected}, got ${actual} (|delta|=${delta}, tolerance=${tolerance})`,
  );
}

test("pearsonCorrelationSignificance returns null for fewer than 3 pairs", () => {
  const result = pearsonCorrelationSignificance([
    { answer1: 1, answer2: 2 },
    { answer1: 2, answer2: 4 },
  ]);

  assert.equal(result, null);
});

test("pearsonCorrelationSignificance returns null when variance is zero", () => {
  const result = pearsonCorrelationSignificance([
    { answer1: 3, answer2: 10 },
    { answer1: 3, answer2: 30 },
    { answer1: 3, answer2: 50 },
  ]);

  assert.equal(result, null);
});

test("pearsonCorrelationSignificance handles perfect positive correlation", () => {
  const result = pearsonCorrelationSignificance([
    { answer1: 1, answer2: 10 },
    { answer1: 2, answer2: 20 },
    { answer1: 3, answer2: 30 },
    { answer1: 4, answer2: 40 },
  ]);

  assert.notEqual(result, null);
  assert.equal(result.tStatistic, Number.POSITIVE_INFINITY);
  assert.equal(result.pValue, 0);
});

test("pearsonCorrelationSignificance matches expected values for a positive-correlation sample", () => {
  const result = pearsonCorrelationSignificance([
    { answer1: 1, answer2: 2 },
    { answer1: 2, answer2: 3 },
    { answer1: 3, answer2: 5 },
    { answer1: 4, answer2: 4 },
    { answer1: 5, answer2: 6 },
    { answer1: 6, answer2: 9 },
  ]);

  assert.notEqual(result, null);

  // Reference values computed with SciPy (stats.t.sf and np.corrcoef).
  assertApprox(result.tStatistic, 4.889732381083922, 1e-12, "t-statistic");
  assertApprox(result.pValue, 0.008103606238573598, 1e-10, "p-value");
});

test("pearsonCorrelationSignificance matches expected values for a negative-correlation sample", () => {
  const result = pearsonCorrelationSignificance([
    { answer1: 1, answer2: 8 },
    { answer1: 2, answer2: 5 },
    { answer1: 3, answer2: 6 },
    { answer1: 4, answer2: 7 },
    { answer1: 5, answer2: 4 },
    { answer1: 6, answer2: 2 },
    { answer1: 7, answer2: 3 },
    { answer1: 8, answer2: 1 },
  ]);

  assert.notEqual(result, null);

  // Reference values computed with SciPy (stats.t.sf and np.corrcoef).
  assertApprox(result.tStatistic, -4.560146566598576, 1e-12, "t-statistic");
  assertApprox(result.pValue, 0.0038503204637324014, 1e-10, "p-value");
});
