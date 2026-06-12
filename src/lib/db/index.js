import { getLocalDb } from './drivers/sqlite-local';

// Dynamic connection cache to prevent creating pools on every serverless function invocation
const connectionCache = {};

/**
 * Retrieve database connection based on active configuration
 * @param {string} orgId - Organization ID (or 'local' in local mode)
 * @param {object} [providedConfig] - Directly provided database settings (used in dashboard settings validation)
 */
export async function getDb(orgId, providedConfig = null) {
  // 1. Check if running in local single-tenant mode
  const isLocal = process.env.LOCAL_MODE === 'true' || orgId === 'local';
  if (isLocal) {
    return getLocalDb();
  }

  // 2. Fetch connection credentials for the organization
  let config = providedConfig;
  if (!config) {
    config = await getOrgDbConfig(orgId);
  }

  if (!config || !config.provider) {
    config = {
      provider: 'sqlite-local',
      credentials: {}
    };
  }

  const { provider, credentials } = config;
  const cacheKey = `${orgId}_${provider}`;

  if (connectionCache[cacheKey]) {
    return connectionCache[cacheKey];
  }

  // 3. Dynamically load the driver plugin based on the active provider
  let driver;
  switch (provider) {
    case 'sqlite-local':
      driver = await import('./drivers/sqlite-local');
      break;
    case 'turso':
      driver = await import('./drivers/turso');
      break;
    case 'firestore':
      driver = await import('./drivers/firestore');
      break;
    case 'supabase':
      driver = await import('./drivers/supabase');
      break;
    case 'mongodb':
      driver = await import('./drivers/mongodb');
      break;
    default:
      throw new Error(`Unsupported database provider: ${provider}`);
  }

  // 4. Initialize and cache connection
  const dbInstance = await driver.initialize(credentials);
  connectionCache[cacheKey] = dbInstance;
  return dbInstance;
}

/**
 * Fallback retrieval of organization DB credentials. 
 * Reads from the master control SQLite database.
 */
async function getOrgDbConfig(orgId) {
  // The control-plane settings are always stored in the local SQLite database
  const masterDb = getLocalDb();
  try {
    const row = await masterDb.get(
      'SELECT db_provider, encrypted_db_credentials FROM settings WHERE org_id = ?',
      orgId
    );
    if (!row) return null;

    // Decrypt credentials if E2EE is enabled on settings (or parse directly if mock-encrypted)
    let credentials = {};
    if (row.encrypted_db_credentials) {
      try {
        credentials = JSON.parse(row.encrypted_db_credentials);
      } catch (e) {
        console.error('Failed to parse db credentials JSON:', e);
      }
    }

    return {
      provider: row.db_provider,
      credentials
    };
  } catch (e) {
    console.error('Failed to retrieve org DB config:', e);
    return null;
  }
}
