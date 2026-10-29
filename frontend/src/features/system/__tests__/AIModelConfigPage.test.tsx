import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AIModelConfigPage } from '../pages/AIModelConfigPage';
import { systemConfigApi } from '../api/systemConfig.api';
import { ISystemConfiguration, ITestAIResponse } from '../types/systemConfig.types';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockConfig: ISystemConfiguration = {
  _id: 'global',
  ai: {
    model: 'gemini-3.5-flash',
    endpoint: 'generativelanguage.googleapis.com',
    temperature: 0.3,
    maxTokens: 2048,
    confidenceThreshold: 75,
    fallbackModel: 'gemini-1.5-flash',
  },
  storage: {
    provider: 'R2',
    bucket: 'herbal-assets',
    region: 'auto',
    cdnBaseUrl: 'https://cdn.virtualherbalgarden.org',
    maxUploadSizeMb: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'model/gltf-binary'],
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'notifications@virtualherbalgarden.org',
    senderName: 'Virtual Herbal Garden',
    senderEmail: 'noreply@virtualherbalgarden.org',
    isSecure: false,
    digestFrequency: 'WEEKLY',
  },
  security: {
    allowedDetectionsPerHour: 10,
    apiRateLimitPerMin: 100,
    authRateLimitPer15Min: 5,
    jwtAccessExpiry: '1h',
    jwtRefreshExpiry: '30d',
    require2faForAdmins: true,
    maxConcurrentSessions: 5,
  },
  general: {
    platformName: 'Virtual Herbal Garden',
    supportEmail: 'support@virtualherbalgarden.org',
    defaultTaxonomy: 'AYURVEDA',
    autoPublishConfidence: 90,
  },
  envDefaults: {
    geminiModel: 'gemini-3.5-flash',
    geminiApiKeyConfigured: true,
    storageProvider: 'R2',
    storageBucket: 'herbal-assets',
    storageRegion: 'auto',
    storageCdnUrl: 'https://cdn.virtualherbalgarden.org',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'notifications@virtualherbalgarden.org',
    smtpConfigured: true,
    senderEmail: 'noreply@virtualherbalgarden.org',
    allowedDetectionsPerHour: 10,
    apiRateLimitPerMin: 100,
    authRateLimitPer15Min: 5,
    jwtAccessExpiry: '1h',
    jwtRefreshExpiry: '30d',
  },
  updatedAt: new Date().toISOString(),
};

const mockTestAIResponse: ITestAIResponse = {
  status: 'ONLINE',
  model: 'gemini-3.5-flash',
  latencyMs: 142,
  responseSample: 'OK',
  message: 'Successfully connected to Gemini API (gemini-3.5-flash) in 142ms',
};

describe('AIModelConfigPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(systemConfigApi, 'getSystemConfig').mockResolvedValue(mockConfig);
    vi.spyOn(systemConfigApi, 'updateSystemConfig').mockResolvedValue(mockConfig);
    vi.spyOn(systemConfigApi, 'testAIConnection').mockResolvedValue(mockTestAIResponse);
    vi.spyOn(systemConfigApi, 'syncWithEnvDefaults').mockResolvedValue(mockConfig);
  });

  it('renders page header and all collapsible configuration cards', async () => {
    render(<AIModelConfigPage />);

    // Wait for data load and check header
    await waitFor(() => {
      expect(screen.getByText(/AI Model & System Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/AI & Gemini Model Engine/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud Storage & Media Delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/Email & Notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Security & Rate Limits/i)).toBeInTheDocument();
      expect(screen.getByText(/Platform & Botanical Policies/i)).toBeInTheDocument();
      expect(screen.getByText(/Cache & Diagnostic Operations/i)).toBeInTheDocument();
    });
  });

  it('can toggle collapsible cards open and closed', async () => {
    render(<AIModelConfigPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/gemini-3.5-flash/)).toBeInTheDocument();
    });

    const aiHeaderBtn = screen.getByRole('button', { name: /Toggle AI & Gemini Model Engine/i });
    expect(aiHeaderBtn).toBeInTheDocument();

    // Collapse the card
    fireEvent.click(aiHeaderBtn);
    expect(screen.queryByDisplayValue(/gemini-3.5-flash/)).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(aiHeaderBtn);
    expect(screen.getByDisplayValue(/gemini-3.5-flash/)).toBeInTheDocument();
  });

  it('triggers live AI ping test and displays latency and status', async () => {
    render(<AIModelConfigPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test AI Connection/i)).toBeInTheDocument();
    });

    const testBtn = screen.getByRole('button', { name: /Test AI Connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(systemConfigApi.testAIConnection).toHaveBeenCalled();
      expect(screen.getByText(/ONLINE/i)).toBeInTheDocument();
      expect(screen.getByText(/142ms/i)).toBeInTheDocument();
    });
  });

  it('allows syncing configuration with server environment variables (.env)', async () => {
    render(<AIModelConfigPage />);

    await waitFor(() => {
      expect(screen.getByText(/Sync with Server .env/i)).toBeInTheDocument();
    });

    const syncBtn = screen.getByRole('button', { name: /Sync with Server .env/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(systemConfigApi.syncWithEnvDefaults).toHaveBeenCalled();
    });
  });

  it('allows clicking quick model presets to update model identifier', async () => {
    render(<AIModelConfigPage />);

    await waitFor(() => {
      expect(screen.getByText('gemini-3.8-flash')).toBeInTheDocument();
    });

    const presetBtn = screen.getByRole('button', { name: 'gemini-3.8-flash' });
    fireEvent.click(presetBtn);

    expect(screen.getByDisplayValue('gemini-3.8-flash')).toBeInTheDocument();
  });

  it('allows updating fields and saving configuration with feedback', async () => {
    render(<AIModelConfigPage />);

    await waitFor(() => {
      expect(screen.getByText(/Save Configuration/i)).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /Save Configuration/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(systemConfigApi.updateSystemConfig).toHaveBeenCalled();
    });
  });
});
