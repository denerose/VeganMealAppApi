type DatabaseConfig = {
  url: string;
};

const getEnv = (key: string): string => {
  const value = Bun.env[key] ?? process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const getDatabaseConfig = (): DatabaseConfig => ({
  url: getEnv('DATABASE_URL'),
});
