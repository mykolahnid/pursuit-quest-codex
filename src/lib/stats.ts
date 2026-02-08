export type AnswerPair = {
  answer1: number;
  answer2: number;
};

export function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export function pearsonCorrelation(pairs: AnswerPair[]): number | null {
  if (pairs.length < 2) {
    return null;
  }

  const xs = pairs.map((pair) => pair.answer1);
  const ys = pairs.map((pair) => pair.answer2);

  const meanX = mean(xs);
  const meanY = mean(ys);

  if (meanX === null || meanY === null) {
    return null;
  }

  let numerator = 0;
  let sumSquaresX = 0;
  let sumSquaresY = 0;

  for (let i = 0; i < pairs.length; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    sumSquaresX += dx * dx;
    sumSquaresY += dy * dy;
  }

  const denominator = Math.sqrt(sumSquaresX * sumSquaresY);
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

export function simpleRegression(pairs: AnswerPair[]): { slope: number; intercept: number } | null {
  if (pairs.length < 2) {
    return null;
  }

  const xs = pairs.map((pair) => pair.answer1);
  const ys = pairs.map((pair) => pair.answer2);
  const meanX = mean(xs);
  const meanY = mean(ys);

  if (meanX === null || meanY === null) {
    return null;
  }

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < pairs.length; i += 1) {
    const dx = xs[i] - meanX;
    numerator += dx * (ys[i] - meanY);
    denominator += dx * dx;
  }

  if (denominator === 0) {
    return null;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

export function correlationInterpretation(r: number | null): string {
  if (r === null) {
    return "Not enough variance or data to compute correlation.";
  }

  const absolute = Math.abs(r);
  if (absolute < 0.2) {
    return "Very weak linear relationship.";
  }

  if (absolute < 0.4) {
    return "Weak linear relationship.";
  }

  if (absolute < 0.6) {
    return "Moderate linear relationship.";
  }

  if (absolute < 0.8) {
    return "Strong linear relationship.";
  }

  return "Very strong linear relationship.";
}

