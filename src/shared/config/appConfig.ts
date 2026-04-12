import * as dotenv from 'dotenv';
import * as path from 'path';

export interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  argon2Secret: string;
}

export interface RuntimeConfig {
  appPort: number;
  isLocal: boolean;
}

export interface AppConfig {
  db: DbConfig;
  auth: AuthConfig;
  runtime: RuntimeConfig;
}

let config: AppConfig | null = null;

function buildConfig(): AppConfig {
  const runLevel = process.env.RUN_LEVEL ?? 'LOCAL';
  const isLocal = runLevel === 'LOCAL';

  if (isLocal) {
    dotenv.config({ path: path.resolve(process.cwd(), 'local.dev.env') });
  }

  return {
    db: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? 'bitvote',
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET ?? '',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      argon2Secret: process.env.ARGON2_SECRET ?? '',
    },
    runtime: {
      appPort: parseInt(process.env.APP_PORT ?? '3000', 10),
      isLocal,
    },
  };
}

export function getConfig(): AppConfig {
  if (!config) {
    config = buildConfig();
  }
  return config;
}

export function initConfigWithValidation(): AppConfig {
  const cfg = getConfig();
  const required: [string, string][] = [
    ['DB_HOST', cfg.db.host],
    ['DB_USERNAME', cfg.db.username],
    ['DB_PASSWORD', cfg.db.password],
    ['DB_DATABASE', cfg.db.database],
    ['JWT_SECRET', cfg.auth.jwtSecret],
    ['JWT_REFRESH_SECRET', cfg.auth.jwtRefreshSecret],
    ['ARGON2_SECRET', cfg.auth.argon2Secret],
  ];
  const missing = required.filter(([, val]) => !val).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return cfg;
}
