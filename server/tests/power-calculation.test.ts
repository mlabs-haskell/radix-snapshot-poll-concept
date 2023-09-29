import { powerFormula } from "../src/domain/power-formula";
import { Vote, VoteToken, makeVerified } from "../src/domain/types";

describe('Power calculation', () => {


  test('Power formulas work', () => {
    expect(powerFormula('linear').apply(4, 2))
      .toBe(8);
    expect(powerFormula('quadratic').apply(4, 2))
      .toBe(4);
    expect(powerFormula('quadratic').apply(5, 2))
      .toBe(4);
  });

  test('Vote power calculation', () => {
    const vote: Vote = { id: "0", voter: "a0", vote: 'yes' };

    const testToken1 = VoteToken.new("not_matter", 1, 'linear');
    expect(makeVerified(vote, 10, testToken1).power).toBe(10);

    const testToken2 = VoteToken.new("not_matter", 3, 'linear');
    expect(makeVerified(vote, 11, testToken2).power).toBe(33);

    const testToken3 = VoteToken.new("not_matter", 3, 'quadratic');
    expect(makeVerified(vote, 16, testToken3).power).toBe(12);
  });
});