import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadPlantModel } from '../api/contributionsApi';
import { api } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  api: {
    upload: vi.fn(),
  },
}));

describe('contributionsApi - uploadPlantModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts formData with binary file and transform overrides to /plants/:id/model', async () => {
    const mockFile = new File(['glTFbinarycontents'], 'gotu-kola.glb', { type: 'model/gltf-binary' });
    const mockResponse = {
      success: true,
      data: {
        _id: '663d1f8e4f1a2b001c8e2020',
        slug: 'gotu-kola',
        modelUrl: '/uploads/models/plants/gotu-kola-lod0.glb',
        modelStatus: 'READY',
      },
    };

    vi.mocked(api.upload).mockResolvedValueOnce(mockResponse as any);

    const res = await uploadPlantModel('gotu-kola', mockFile, 'lod0', {
      targetHeightM: 0.5,
      rotationY: 1.57,
      offsetY: 0.1,
      scale: 1.0,
    });

    expect(api.upload).toHaveBeenCalledTimes(1);
    const [endpoint, formData] = vi.mocked(api.upload).mock.calls[0];
    expect(endpoint).toBe('/plants/gotu-kola/model');
    expect(formData.get('model')).toBe(mockFile);
    expect(formData.get('lod')).toBe('lod0');
    expect(formData.get('targetHeightM')).toBe('0.5');
    expect(formData.get('rotationY')).toBe('1.57');
    expect(formData.get('offsetY')).toBe('0.1');
    expect(formData.get('scale')).toBe('1');
    expect(res).toEqual(mockResponse.data);
  });
});

