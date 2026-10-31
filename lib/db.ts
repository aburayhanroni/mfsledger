import { neon, NeonQueryFunction } from '@neondatabase/serverless';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  return url;
}

// Global cached client instance for serverless reuse across invocations
let cachedClient: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!cachedClient) {
    cachedClient = neon(getDatabaseUrl());
  }
  return cachedClient;
}

export const sql = (strings: TemplateStringsArray, ...values: any[]): Promise<any> => {
  const client = getClient();
  return client(strings, ...values);
};

