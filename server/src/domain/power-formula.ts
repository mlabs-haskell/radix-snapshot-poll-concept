// defining types of available formulas
const powerFormulas = [
  'linear',
  'quadratic'
] as const;

type PowerFormula = typeof powerFormulas[number];

// asset that formula type is known as it is still possible to pass `any` 
// to the controller from the frontend
const assertIsFormula = (f: any) => {
  if (!powerFormulas.includes(f)) throw Error(`Unknown power calculation formula: ${f}`)
};

// main function to apply power calculation formula
const powerFormula = (formula: PowerFormula) => {
  assertIsFormula(formula);
  return {
    apply: formulas[formula]
  }
};

// defining shape of the power calculation formula
type Formula = (balance: number, tokenWeight: number) => number;

// helper const to organize formulas
const formulas: Record<PowerFormula, Formula> = {
  linear: (balance: number, tokenWeight: number) => balance * tokenWeight,
  quadratic: (balance: number, tokenWeight: number) => Math.trunc(Math.sqrt(balance)) * tokenWeight,
};

export { PowerFormula, assertIsFormula, powerFormula };
