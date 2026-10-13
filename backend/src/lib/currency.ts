import { EXCHANGE_RATES_TO_USD } from "../domain/constants.js";

export function toUsd(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES_TO_USD[currency];
  if (rate === undefined) {
    throw new Error(`Unknown currency: ${currency}`);
  }
  return amount * rate;
}
