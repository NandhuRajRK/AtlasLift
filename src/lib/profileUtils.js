export function selectPrimaryProfile(profiles = []) {
  if (!Array.isArray(profiles) || profiles.length === 0) return null;

  const sorted = [...profiles].sort((a, b) => {
    const at = new Date(a?.created_date || 0).getTime();
    const bt = new Date(b?.created_date || 0).getTime();
    return bt - at;
  });

  return sorted.find((p) => Boolean(p?.onboardingComplete)) || sorted[0];
}
