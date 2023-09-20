import { BalanceInfo, Snapshot } from "../types";

describe('Snapshot invariants', () => {

  test('building snapshot', () => {
    const b1: BalanceInfo =
    {
      fromStateVersion: 1,
      ownerAddress: "a1",
      tokenAddress: "t1",
      balance: 1
    };
    const b2: BalanceInfo =
    {
      fromStateVersion: 1,
      ownerAddress: "a2",
      tokenAddress: "t2",
      balance: 2
    };
    const snapshot = Snapshot.fromBalances(1, [b1, b2])
    expect(snapshot.getBalanceInfo("a1")).toBe(b1);
    expect(snapshot.balanceOf("a1")).toBe(b1.balance);
    expect(snapshot.getBalanceInfo("a2")).toBe(b2);
    expect(snapshot.balanceOf("a2")).toBe(b2.balance);
    expect(snapshot.getBalanceInfo("a3")).toBe(undefined);
  });

  test('adding balance info with later state version fails', () => {
    const badBalance: BalanceInfo =
    {
      fromStateVersion: 2,
      ownerAddress: "a1",
      tokenAddress: "t1",
      balance: 1
    };
    const makeSnapshot = () => Snapshot.fromBalances(1, [badBalance])
    expect(makeSnapshot)
      .toThrow("Tired to add balance info has higher state version than snapshot: 2 vs. 1.Something went very wrong.");
  });

  test('adding balance info for existing account address fails', () => {
    const balance: BalanceInfo =
    {
      fromStateVersion: 1,
      ownerAddress: "a1",
      tokenAddress: "t1",
      balance: 1
    };
    const makeSnapshot = () => Snapshot.fromBalances(balance.fromStateVersion, [balance, balance])
    expect(makeSnapshot)
      .toThrow(new RegExp('^Duplicated token owner address in the snapshot'));
  });
});
