export interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl: env.DATABASE_URL ?? 'postgres://election:election@localhost:5432/election_dev',
    jwtSecret: env.JWT_SECRET ?? 'dev-secret',
  };
}
