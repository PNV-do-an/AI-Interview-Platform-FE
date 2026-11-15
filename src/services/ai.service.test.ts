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

/** Nạp lại module với đúng URL build để kiểm tra thứ tự ưu tiên build ↔ URL lưu tay. */
const loadServiceForBuild = (buildUrl: string): typeof AIService => {
  const original = process.env.REACT_APP_AI_SERVICE_URL;
  process.env.REACT_APP_AI_SERVICE_URL = buildUrl;
  jest.resetModules();
  let service: typeof AIService | undefined;
  jest.isolateModules(() => {
    service = require('./ai.service').default;
  });
  process.env.REACT_APP_AI_SERVICE_URL = original;
  return service!;
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

describe('AIService build URL precedence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('uses the deployed build URL instead of a manual URL saved by an older build', () => {
    window.localStorage.setItem('ai_service_url', 'https://old-tunnel.example.test');
    window.localStorage.setItem('ai_service_url_build', 'https://old-build.example.test');

    const service = loadServiceForBuild('https://build.example.test');

    expect(service.getServiceUrl()).toBe('https://build.example.test');
    expect(service.isUsingBuildUrl()).toBe(true);
    expect(window.localStorage.getItem('ai_service_url')).toBeNull();
  });

  it('keeps a manual URL saved on the current build until it is reset', () => {
    const service = loadServiceForBuild('https://build.example.test');
    expect(service.setServiceUrl('https://new-tunnel.example.test')).toBe('https://new-tunnel.example.test');
    expect(service.getServiceUrl()).toBe('https://new-tunnel.example.test');
    expect(service.isUsingBuildUrl()).toBe(false);

    expect(service.resetToBuildUrl()).toBe('https://build.example.test');
    expect(service.isUsingBuildUrl()).toBe(true);
    expect(window.localStorage.getItem('ai_service_url')).toBeNull();
  });

  it('honours a manual URL when it was saved against the same build URL', () => {
    window.localStorage.setItem('ai_service_url', 'https://manual.example.test');
    window.localStorage.setItem('ai_service_url_build', 'https://build.example.test');

    const service = loadServiceForBuild('https://build.example.test');

    expect(service.getServiceUrl()).toBe('https://manual.example.test');
    expect(service.isUsingBuildUrl()).toBe(false);
  });
});
