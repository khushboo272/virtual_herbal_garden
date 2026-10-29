export interface IAIConfig {
  model: string;
  endpoint: string;
  temperature: number;
  maxTokens: number;
  confidenceThreshold: number;
  fallbackModel: string;
}

export interface IStorageConfig {
  provider: 'S3' | 'R2' | 'LOCAL';
  bucket: string;
  region: string;
  cdnBaseUrl: string;
  maxUploadSizeMb: number;
  allowedMimeTypes: string[];
}

export interface IEmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  senderName: string;
  senderEmail: string;
  isSecure: boolean;
  digestFrequency: 'DAILY' | 'WEEKLY' | 'NEVER';
}

export interface ISecurityConfig {
  allowedDetectionsPerHour: number;
  apiRateLimitPerMin: number;
  authRateLimitPer15Min: number;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  require2faForAdmins: boolean;
  maxConcurrentSessions: number;
}

export interface IGeneralConfig {
  platformName: string;
  supportEmail: string;
  defaultTaxonomy: string;
  autoPublishConfidence: number;
}

export interface IEnvDefaults {
  geminiModel: string;
  geminiApiKeyConfigured: boolean;
  storageProvider: 'S3' | 'R2' | 'LOCAL';
  storageBucket: string;
  storageRegion: string;
  storageCdnUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpConfigured: boolean;
  senderEmail: string;
  allowedDetectionsPerHour: number;
  apiRateLimitPerMin: number;
  authRateLimitPer15Min: number;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
}

export interface ISystemConfiguration {
  _id: string;
  ai: IAIConfig;
  storage: IStorageConfig;
  email: IEmailConfig;
  security: ISecurityConfig;
  general: IGeneralConfig;
  envDefaults?: IEnvDefaults;
  updatedAt: string;
}

export interface IUpdateSystemConfigPayload {
  ai?: Partial<IAIConfig>;
  storage?: Partial<IStorageConfig>;
  email?: Partial<IEmailConfig>;
  security?: Partial<ISecurityConfig>;
  general?: Partial<IGeneralConfig>;
}

export interface ITestAIResponse {
  status: 'ONLINE' | 'DEGRADED' | 'UNAVAILABLE';
  model: string;
  latencyMs: number;
  responseSample?: string;
  message: string;
}
