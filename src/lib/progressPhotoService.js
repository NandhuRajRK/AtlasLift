import { appClient } from '@/api/localClient';

export async function uploadProgressPhoto({ date, dataUrl }) {
  return appClient.entities.BodyMetric.create({ date, progressPhotoUrl: dataUrl });
}

export async function replaceProgressPhoto({ metricId, dataUrl }) {
  return appClient.entities.BodyMetric.update(metricId, { progressPhotoUrl: dataUrl });
}

export async function deleteProgressPhoto(metric) {
  const hasMeasurements = ['bodyweightKg', 'waistCm', 'chestCm', 'armCm', 'thighCm']
    .some((k) => Number.isFinite(Number(metric[k])));

  if (hasMeasurements) {
    return appClient.entities.BodyMetric.update(metric.id, { progressPhotoUrl: undefined });
  }
  return appClient.entities.BodyMetric.delete(metric.id);
}

