jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => {
      const client = {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
      };
      return client;
    }),
  },
}));

import AIService from './ai.service';

const mockClient = jest.requireMock('axios').default.create.mock.results[0].value as {
  get: jest.Mock;
  post: jest.Mock;
  delete: jest.Mock;
};

describe('AIService runtime URL', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('uses the saved runtime URL for API calls without sending authentication headers', async () => {
    AIService.setServiceUrl('https://ai.example.test/');
    mockClient.get.mockResolvedValue({ data: { status: 'ok' } });

    await AIService.health();

    expect(mockClient.get).toHaveBeenCalledWith('https://ai.example.test/health', { baseURL: '' });
    expect(mockClient.get.mock.calls[0][1].headers?.Authorization).toBeUndefined();
  });

  it('rejects unsafe or incomplete service URLs without saving them', () => {
    expect(() => AIService.setServiceUrl('javascript:alert(1)')).toThrow('HTTP/HTTPS');
    expect(window.localStorage.getItem('ai_service_url')).toBeNull();
  });

  it('normalizes a URL before saving it', () => {
    expect(AIService.setServiceUrl(' https://ai.example.test/// ')).toBe('https://ai.example.test');
    expect(AIService.getServiceUrl()).toBe('https://ai.example.test');
  });
});
