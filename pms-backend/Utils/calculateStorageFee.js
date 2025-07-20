export function calculateStorageCharges(offloadDate, releaseDate, totalWeight) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((releaseDate - offloadDate) / msPerDay);

  if (diffDays <= 14) return 0;

  let total = 0;

  if (diffDays > 14 && diffDays <= 30) {
    total += (diffDays - 14) * totalWeight * 0.6;
  } else if (diffDays > 30) {
    total += (16 * totalWeight * 0.6) + ((diffDays - 30) * totalWeight * 1.2);
  }

  return total;
}
