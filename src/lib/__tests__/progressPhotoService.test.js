import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appClient } from '@/api/localClient';
import { deleteProgressPhoto, replaceProgressPhoto, uploadProgressPhoto } from '@/lib/progressPhotoService';

vi.mock('@/api/localClient', () => ({
  appClient: {
    entities: {
      BodyMetric: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}));

describe('progressPhotoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates photo metric rows on upload', async () => {
    await uploadProgressPhoto({ date: '2026-05-17', dataUrl: 'data:image/png;base64,abc' });
    expect(appClient.entities.BodyMetric.create).toHaveBeenCalled();
  });

  it('updates existing photo rows on replace', async () => {
    await replaceProgressPhoto({ metricId: 'm1', dataUrl: 'data:image/png;base64,new' });
    expect(appClient.entities.BodyMetric.update).toHaveBeenCalledWith('m1', { progressPhotoUrl: 'data:image/png;base64,new' });
  });

  it('deletes photo-only rows but preserves rows with measurements', async () => {
    await deleteProgressPhoto({ id: 'm1', progressPhotoUrl: 'x' });
    expect(appClient.entities.BodyMetric.delete).toHaveBeenCalledWith('m1');

    await deleteProgressPhoto({ id: 'm2', progressPhotoUrl: 'x', bodyweightKg: 80 });
    expect(appClient.entities.BodyMetric.update).toHaveBeenCalledWith('m2', { progressPhotoUrl: undefined });
  });
});

