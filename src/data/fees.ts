export type FeeItem = {
  id: string;
  amountDKK: number;
};

export const fees: FeeItem[] = [
  { id: "early-checkin-unauthorized", amountDKK: 200 },
  { id: "late-checkout-unauthorized", amountDKK: 200 },
  { id: "hottub-over-42c", amountDKK: 500 },
  { id: "hottub-not-emptied", amountDKK: 500 },
  { id: "grill-not-cleaned", amountDKK: 300 },
  { id: "trash-not-disposed", amountDKK: 200 },
  { id: "dishwasher-not-emptied", amountDKK: 200 },
  { id: "outdoor-furniture-not-returned", amountDKK: 300 },
  { id: "loft-toys-not-tidied", amountDKK: 200 },
  { id: "doors-windows-not-locked", amountDKK: 300 },
  { id: "noise-complaints", amountDKK: 1000 },
  { id: "remotes-missing", amountDKK: 300 },
  { id: "keys-missing", amountDKK: 500 },
  { id: "mattress-soiling", amountDKK: 1000 },
  { id: "indoor-smoking", amountDKK: 2500 },
  { id: "sauna-damage", amountDKK: 2500 },
  { id: "sauna-stove-damage", amountDKK: 4500 },
  { id: "pool-tech-damage", amountDKK: 6000 },
];
