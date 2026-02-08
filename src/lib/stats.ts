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

function logGamma(value: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    0.000009984369578019572,
    0.00000015056327351493116,
  ];

  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }

  const adjusted = value - 1;
  let accumulator = 0.9999999999998099;

  for (let i = 0; i < coefficients.length; i += 1) {
    accumulator += coefficients[i] / (adjusted + i + 1);
  }

  const g = 7;
  const t = adjusted + g + 0.5;

  return (
    0.5 * Math.log(2 * Math.PI) +
    (adjusted + 0.5) * Math.log(t) -
    t +
    Math.log(accumulator)
  );
}

function betacf(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const epsilon = 0.0000003;
  const tiny = 1e-30;

  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < tiny) {
    d = tiny;
  }
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;

    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) {
      d = tiny;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) {
      c = tiny;
    }
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) {
      d = tiny;
    }
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) {
      c = tiny;
    }
    d = 1 / d;

    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < epsilon) {
      break;
    }
  }

  return h;
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) {
    return 0;
  }

  if (x >= 1) {
    return 1;
  }

  const logBeta =
    logGamma(a + b) -
    logGamma(a) -
    logGamma(b) +
    a * Math.log(x) +
    b * Math.log(1 - x);
  const front = Math.exp(logBeta);

  if (x < (a + 1) / (a + b + 2)) {
    return (front * betacf(x, a, b)) / a;
  }

  return 1 - (front * betacf(1 - x, b, a)) / b;
}

function studentTCdf(value: number, degreesOfFreedom: number): number {
  if (!Number.isFinite(value) || degreesOfFreedom <= 0) {
    return Number.NaN;
  }

  if (value === 0) {
    return 0.5;
  }

  const x = degreesOfFreedom / (degreesOfFreedom + value * value);
  const ib = regularizedIncompleteBeta(x, degreesOfFreedom / 2, 0.5);

  if (value > 0) {
    return 1 - 0.5 * ib;
  }

  return 0.5 * ib;
}

export function pearsonCorrelationSignificance(pairs: AnswerPair[]): { tStatistic: number; pValue: number } | null {
  if (pairs.length < 3) {
    return null;
  }

  const correlation = pearsonCorrelation(pairs);
  if (correlation === null) {
    return null;
  }

  // Correlation must be strictly inside [-1, 1] for finite t.
  if (Math.abs(correlation) >= 1) {
    return {
      tStatistic: correlation > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
      pValue: 0,
    };
  }

  const degreesOfFreedom = pairs.length - 2;
  const tStatistic = correlation * Math.sqrt(degreesOfFreedom / (1 - correlation * correlation));
  const cdf = studentTCdf(Math.abs(tStatistic), degreesOfFreedom);

  if (!Number.isFinite(cdf)) {
    return null;
  }

  const pValue = Math.max(0, Math.min(1, 2 * (1 - cdf)));

  return { tStatistic, pValue };
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
