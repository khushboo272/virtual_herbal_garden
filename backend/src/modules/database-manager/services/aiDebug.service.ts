import { GoogleGenAI } from '@google/genai';
import { env } from '../../../core/config/env';
import { logger } from '../../../core/utils/logger';

export interface AiDebugContext {
  collection?: string;
  operation?: string;
  mode?: string;
  payloadSnippet?: string;
}

export interface AiDebugResult {
  analysis: string;
  model: string;
  timestamp: string;
}

export class AiDebugService {
  async diagnose(errorMessage: string, context?: AiDebugContext): Promise<AiDebugResult> {
    const key = env.GEMINI_API_KEY;
    const model = env.GEMINI_MODEL || 'gemini-3.5-flash';

    if (!key) {
      return {
        analysis: this.generateLocalDiagnosis(errorMessage, context),
        model: 'local-diagnostic-engine',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const client = new GoogleGenAI({ apiKey: key });
      const prompt = `You are the Virtual Herbal Garden Expert Database Diagnostic AI.
Analyze the following database error and operation context from the administrative database control center.

Error Message:
"""
${errorMessage}
"""

Context:
- Operation: ${context?.operation || 'Database Operation'}
- Target Collection: ${context?.collection || 'Unknown'}
- Mode: ${context?.mode || 'N/A'}
${context?.payloadSnippet ? `- Payload Snippet:\n"""\n${context.payloadSnippet}\n"""` : ''}

Provide a structured, beautifully formatted markdown analysis with:
### 1. 🔍 Root Cause Analysis
Explain in plain English what caused this error to occur.

### 2. 🌿 Botanical & Schema Implications
Explain the specific database constraint or schema conflict (e.g., duplicate index on scientificName or slug, required field missing like createdBy, invalid ObjectID references, or optimistic concurrency version mismatch).

### 3. 🛠️ Actionable Recommended Fix
Give concrete, step-by-step instructions or copy-paste code/JSON to fix or bypass this issue immediately (e.g. switching import mode to Upsert, removing the duplicate key, or merging the record).`;

      const response = await client.models.generateContent({
        model,
        contents: prompt,
      });

      const analysis = response.text || this.generateLocalDiagnosis(errorMessage, context);
      return {
        analysis,
        model,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      logger.warn(`Gemini AI debug call failed, using heuristic diagnosis: ${err.message}`);
      return {
        analysis: this.generateLocalDiagnosis(errorMessage, context),
        model: 'fallback-diagnostic-engine',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private generateLocalDiagnosis(errorMessage: string, context?: AiDebugContext): string {
    const isDup = errorMessage.includes('E11000') || errorMessage.includes('duplicate key') || errorMessage.includes('DUPLICATE_KEY');
    const isValidation = errorMessage.includes('validation failed') || errorMessage.includes('required');
    const isConcurrency = errorMessage.includes('concurrently') || errorMessage.includes('409');

    if (isDup) {
      const matchKey = errorMessage.match(/dup key: \{ ([^}]+) \}/);
      const keyInfo = matchKey ? matchKey[1] : 'unique field';
      return `### 🔍 Root Cause Analysis
A unique key collision was detected on **${keyInfo}**. MongoDB rejected the insertion because a document already exists in the collection with this exact unique identifier.

### 🌿 Botanical & Schema Implications
In Virtual Herbal Garden, collections like \`plants\` have unique indexes on both \`slug\` and \`scientificName\` to prevent duplicate taxonomy entries.

### 🛠️ Actionable Recommended Fix
1. **Switch to Upsert Mode**: In the Import dropdown, choose **"Upsert by unique key"** instead of "Insert-only".
2. **Auto-update on Duplicate**: The database manager import engine will now automatically update the existing botanical monograph rather than rolling back.
3. **Verify Seed Data**: Ensure there are no duplicate entries with the same scientific name inside your JSON file.`;
    }

    if (isValidation) {
      return `### 🔍 Root Cause Analysis
The payload failed schema validation. A required field is missing or contains an invalid data type.

### 🌿 Botanical & Schema Implications
All documents must conform to the defined Mongoose and Zod schemas (e.g., \`commonName\`, \`scientificName\`, \`family\`, \`description\`, and \`createdBy\`).

### 🛠️ Actionable Recommended Fix
1. Inspect the JSON payload and ensure all required fields are present.
2. Check that enum fields like \`toxicityLevel\` use allowed values (\`NONE\`, \`LOW\`, \`MODERATE\`, \`HIGH\`).`;
    }

    if (isConcurrency) {
      return `### 🔍 Root Cause Analysis
The document was updated concurrently by another user or session after you loaded it.

### 🌿 Botanical & Schema Implications
Optimistic concurrency control prevented overwriting unseen changes.

### 🛠️ Actionable Recommended Fix
1. Refresh the document to load the latest version.
2. Re-apply your edits on top of the fresh state.`;
    }

    return `### 🔍 Root Cause Analysis
An operational database error occurred during execution: \`${errorMessage}\`.

### 🌿 Botanical & Schema Implications
Operation: ${context?.operation || 'general'}, Collection: ${context?.collection || 'unspecified'}.

### 🛠️ Actionable Recommended Fix
1. Review the error message details above.
2. If this was an import, try running a Dry Run first to inspect predicted row-by-row actions.
3. Check the Job History tab in Database Manager for the full audit trail.`;
  }
}

export const aiDebugService = new AiDebugService();

