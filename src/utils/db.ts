/**
 * BritConnect IndexedDB Persistence Layer
 * Powered by idb for robust client-side storage
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CleanCustomer, EngineeredCustomer, ModelTrainedVersion, RetentionCampaign, AppSettings } from '../types';

interface BritConnectDB extends DBSchema {
  datasets: {
    key: string;
    value: {
      id: string;
      name: string;
      loadedAt: string;
      rawCount: number;
      cleanedCount: number;
      raw: unknown[];
      cleaned: CleanCustomer[];
      engineered: EngineeredCustomer[];
    };
  };
  models: {
    key: string;
    value: ModelTrainedVersion;
  };
  campaigns: {
    key: string;
    value: RetentionCampaign;
  };
  chatHistory: {
    key: string;
    value: {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
      verified?: boolean;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'britconnect_churn_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BritConnectDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BritConnectDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BritConnectDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('datasets')) {
          db.createObjectStore('datasets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('campaigns')) {
          db.createObjectStore('campaigns', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chatHistory')) {
          db.createObjectStore('chatHistory', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveDatasetToIDB(data: {
  id: string;
  name: string;
  loadedAt: string;
  rawCount: number;
  cleanedCount: number;
  raw: unknown[];
  cleaned: CleanCustomer[];
  engineered: EngineeredCustomer[];
}) {
  const db = await getDB();
  await db.put('datasets', data);
}

export async function loadLatestDatasetFromIDB() {
  const db = await getDB();
  const all = await db.getAll('datasets');
  if (all.length > 0) {
    return all[all.length - 1];
  }
  return null;
}

export async function saveModelToIDB(model: ModelTrainedVersion) {
  const db = await getDB();
  await db.put('models', model);
}

export async function loadModelsFromIDB(): Promise<ModelTrainedVersion[]> {
  const db = await getDB();
  return db.getAll('models');
}

export async function deleteModelFromIDB(id: string) {
  const db = await getDB();
  await db.delete('models', id);
}

export async function saveCampaignToIDB(campaign: RetentionCampaign) {
  const db = await getDB();
  await db.put('campaigns', campaign);
}

export async function loadCampaignsFromIDB(): Promise<RetentionCampaign[]> {
  const db = await getDB();
  return db.getAll('campaigns');
}

export async function deleteCampaignFromIDB(id: string) {
  const db = await getDB();
  await db.delete('campaigns', id);
}

export async function clearAllIDBData() {
  const db = await getDB();
  await db.clear('datasets');
  await db.clear('models');
  await db.clear('campaigns');
  await db.clear('chatHistory');
  await db.clear('settings');
}
