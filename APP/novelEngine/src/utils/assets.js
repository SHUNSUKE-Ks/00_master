export function resolveAssetPath(asset) {
  if (!asset) return "";
  return asset.cutoutPath ?? asset.demoPath ?? asset.assetPath ?? asset.path ?? "";
}

export function resolveStandingAsset(character, variant) {
  if (!character) return "";

  const standingItems = character.assetSlots?.standing?.items ?? [];
  const standingItem = standingItems.find((item) => item.variant === variant);
  if (standingItem) return resolveAssetPath(standingItem);

  return character.standingAssets?.[variant] ?? resolveAssetPath(character);
}
