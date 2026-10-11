export const selectWinningPositions = (quantity, winnerCount, randomBytes = crypto.getRandomValues.bind(crypto)) => {
  if (!Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(winnerCount) || winnerCount < 0 || winnerCount > quantity) {
    throw new RangeError('Invalid sticker or winner count');
  }
  const positions = Array.from({ length: quantity }, (_, index) => index);
  for (let i = positions.length - 1; i > 0; i--) {
    const sample = new Uint32Array(1);
    const range = i + 1;
    const limit = Math.floor(0x100000000 / range) * range;
    do {
      randomBytes(sample);
    } while (sample[0] >= limit);
    const j = sample[0] % (i + 1);
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return new Set(positions.slice(0, winnerCount));
};
