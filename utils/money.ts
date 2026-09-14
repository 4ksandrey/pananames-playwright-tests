export type Money = {
  currency: 'USD';
  minorUnits: number;
};

export function parseMoney(text: string): Money {
  const amounts = [...text.matchAll(/\$\s*([\d,]+)(?:\.(\d{2}))?/g)];
  const effectiveAmount = amounts.at(-1);

  if (!effectiveAmount) {
    throw new Error(`Could not parse a USD amount from: "${text}"`);
  }

  const wholeUnits = Number(effectiveAmount[1].replaceAll(',', ''));
  const fractionalUnits = Number(effectiveAmount[2] ?? '00');

  if (!Number.isSafeInteger(wholeUnits)) {
    throw new Error(`USD amount is outside the supported integer range: "${text}"`);
  }

  return {
    currency: 'USD',
    minorUnits: wholeUnits * 100 + fractionalUnits,
  };
}
