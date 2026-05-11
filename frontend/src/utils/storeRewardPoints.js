/**
 * Stamps needed for a free reward for this store.
 * Prefers `store_points`; falls back to legacy `max_points`, then default.
 */
export function getStoreRewardStampCount(storeLike) {
  const fromStorePoints = Number(storeLike?.store_points);
  if (Number.isFinite(fromStorePoints) && fromStorePoints > 0) {
    return fromStorePoints;
  }
  const fromMaxPoints = Number(storeLike?.max_points);
  if (Number.isFinite(fromMaxPoints) && fromMaxPoints > 0) {
    return fromMaxPoints;
  }
  return 6;
}
