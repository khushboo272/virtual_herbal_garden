import mongoose, { Schema, Document } from 'mongoose';

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

export interface ISystemConfig extends Document<string> {
  _id: string;
  ai: IAIConfig;
  storage: IStorageConfig;
  email: IEmailConfig;
  security: ISecurityConfig;
  general: IGeneralConfig;

  // Backwards compatibility fields
  aiModelVersion: string;
  featuredPlantIds: mongoose.Types.ObjectId[];
  maintenanceMode: boolean;
  maintenanceReopenAt?: Date | null;
  maintenanceHeadline?: string | null;
  maintenanceReason?: string | null;
  maintenanceAllowedRoles?: string[];
  allowedDetectionsPerHour: number;
  featureFlags: Map<string, boolean>;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    _id: { type: String, default: 'global' },
    ai: {
      model: { type: String, default: 'gemini-3.5-flash' },
      endpoint: { type: String, default: 'generativelanguage.googleapis.com' },
      temperature: { type: Number, default: 0.3, min: 0, max: 1 },
      maxTokens: { type: Number, default: 2048, min: 256, max: 8192 },
      confidenceThreshold: { type: Number, default: 75, min: 1, max: 100 },
      fallbackModel: { type: String, default: 'gemini-1.5-flash' },
    },
    storage: {
      provider: { type: String, enum: ['S3', 'R2', 'LOCAL'], default: 'R2' },
      bucket: { type: String, default: 'herbal-assets' },
      region: { type: String, default: 'auto' },
      cdnBaseUrl: { type: String, default: '' },
      maxUploadSizeMb: { type: Number, default: 10, min: 1, max: 100 },
      allowedMimeTypes: {
        type: [String],
        default: ['image/jpeg', 'image/png', 'image/webp', 'model/gltf-binary'],
      },
    },
    email: {
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: 'notifications@virtualherbalgarden.org' },
      senderName: { type: String, default: 'Virtual Herbal Garden' },
      senderEmail: { type: String, default: 'noreply@virtualherbalgarden.org' },
      isSecure: { type: Boolean, default: false },
      digestFrequency: { type: String, enum: ['DAILY', 'WEEKLY', 'NEVER'], default: 'WEEKLY' },
    },
    security: {
      allowedDetectionsPerHour: { type: Number, default: 10, min: 1, max: 500 },
      apiRateLimitPerMin: { type: Number, default: 100, min: 10, max: 2000 },
      authRateLimitPer15Min: { type: Number, default: 5, min: 1, max: 50 },
      jwtAccessExpiry: { type: String, default: '1h' },
      jwtRefreshExpiry: { type: String, default: '30d' },
      require2faForAdmins: { type: Boolean, default: true },
      maxConcurrentSessions: { type: Number, default: 5, min: 1, max: 20 },
    },
    general: {
      platformName: { type: String, default: 'Virtual Herbal Garden' },
      supportEmail: { type: String, default: 'support@virtualherbalgarden.org' },
      defaultTaxonomy: { type: String, default: 'AYURVEDA' },
      autoPublishConfidence: { type: Number, default: 90, min: 50, max: 100 },
    },

    // Legacy fields
    aiModelVersion: { type: String, default: 'v2.3.1' },
    featuredPlantIds: [{ type: Schema.Types.ObjectId, ref: 'Plant' }],
    maintenanceMode: { type: Boolean, default: false },
    maintenanceReopenAt: { type: Date, default: null },
    maintenanceHeadline: { type: String, default: 'System Maintenance in Progress' },
    maintenanceReason: { type: String, default: 'We are performing scheduled upgrades and maintenance.' },
    maintenanceAllowedRoles: { type: [String], default: ['SUPER_ADMIN', 'ADMIN'] },
    allowedDetectionsPerHour: { type: Number, default: 10 },
    featureFlags: { type: Map, of: Boolean, default: new Map() },
  },
  { timestamps: true }
);

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
