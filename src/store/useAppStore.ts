/**
 * BritConnect Global State Store (Zustand)
 * Manages full lifecycle: Ingest -> Quality -> Features -> ML Train -> Scoring -> Act
 */
import { create } from 'zustand';
import {
  CleanCustomer,
  EngineeredCustomer,
  DataQualityReport,
  CleaningAuditEntry,
  ModelTrainedVersion,
  RetentionCampaign,
  GlobalFilters,
  AppSettings,
  ModelType,
} from '../types';
import { SAMPLE_CSV_RAW } from '../utils/sampleData';
import { parseDelimitedText } from '../ingest/fileParser';
import { validateCustomerDataset } from '../clean/dataValidator';
import { cleanCustomerDataset } from '../clean/dataCleaner';
import { engineerCustomerFeatures } from '../features/featureEngineering';
import { trainModelWithCV, scoreCustomersWithModel } from '../ml/trainingCoordinator';
import { INITIAL_DEMO_CAMPAIGNS } from '../campaigns/campaignManager';
import {
  saveDatasetToIDB,
  loadLatestDatasetFromIDB,
  saveModelToIDB,
  loadModelsFromIDB,
  saveCampaignToIDB,
  loadCampaignsFromIDB,
  clearAllIDBData,
} from '../utils/db';
import { compilePrecomputedFacts, askAIAnalyst } from '../chat/analystService';

export type AppNavView =
  | 'home'
  | 'quality'
  | 'dashboard'
  | 'explorer'
  | 'models'
  | 'scoring'
  | 'explain'
  | 'segments'
  | 'playbook'
  | 'campaigns'
  | 'analyst'
  | 'reports'
  | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  verified?: boolean;
  isAi?: boolean;
}

export interface AppState {
  currentView: AppNavView;
  datasetName: string;
  rawDataset: Record<string, unknown>[];
  cleanDataset: CleanCustomer[];
  engineeredDataset: EngineeredCustomer[];
  qualityReport: DataQualityReport | null;
  cleaningAuditLog: CleaningAuditEntry[];
  models: ModelTrainedVersion[];
  championModel: ModelTrainedVersion | null;
  campaigns: RetentionCampaign[];
  globalFilters: GlobalFilters;
  appSettings: AppSettings;
  isTraining: boolean;
  trainingProgress: number;
  trainingStatus: string;
  selectedCustomerId: string | null;
  firstRunTourStep: number; // 0 = inactive, 1..5 active
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isChatLoading: boolean;

  uploadedAt: string | null;
  isRefreshing: boolean;

  // Actions
  setCurrentView: (view: AppNavView) => void;
  loadSampleDataset: () => Promise<void>;
  loadCustomRecords: (records: Record<string, unknown>[], name: string, persistToServer?: boolean) => Promise<void>;
  refreshFromServer: () => Promise<boolean>;
  trainModelAction: (type: ModelType, name?: string) => Promise<void>;
  setChampionModelAction: (modelId: string) => void;
  setGlobalFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  resetGlobalFilters: () => void;
  setSelectedCustomerId: (id: string | null) => void;
  setFirstRunTourStep: (step: number) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  clearAllPlatformData: () => Promise<void>;
  addCampaignAction: (campaign: RetentionCampaign) => Promise<void>;
  toggleChat: () => void;
  sendChatMessage: (query: string) => Promise<void>;
  initApp: () => Promise<void>;
}

const DEFAULT_FILTERS: GlobalFilters = {
  dateRange: 'all',
  customerSegment: 'all',
  serviceType: 'all',
  ukNation: 'all',
  city: 'all',
  contractType: 'all',
  acquisitionChannel: 'all',
  riskBand: 'all',
  search: '',
};

const DEFAULT_SETTINGS: AppSettings = {
  allowAiNarrative: true,
  maskCustomerIds: false,
  decisionThreshold: 0.45,
  costPerRetentionOffer: 15.0,
  offerSuccessRate: 30.0,
  averageMarginPercent: 40.0,
  evaluationHorizonMonths: 12,
  randomSeed: 42,
  cvFolds: 5,
  cvRepeats: 2,
};

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  datasetName: 'BritConnect_Sample_Data.csv',
  rawDataset: [],
  cleanDataset: [],
  engineeredDataset: [],
  qualityReport: null,
  cleaningAuditLog: [],
  models: [],
  championModel: null,
  campaigns: INITIAL_DEMO_CAMPAIGNS,
  globalFilters: DEFAULT_FILTERS,
  appSettings: DEFAULT_SETTINGS,
  isTraining: false,
  trainingProgress: 0,
  trainingStatus: '',
  selectedCustomerId: 'BCT-000001',
  firstRunTourStep: 0,
  chatMessages: [
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hello, I'm the **BritConnect Senior Retention Analyst**. Every metric and probability in this platform is computed strictly from your customer portfolio. Ask me anything about churn drivers, rolling contract exposure, network outages, or specific retention campaigns!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verified: true,
      isAi: false,
    },
  ],
  isChatOpen: false,
  isChatLoading: false,
  uploadedAt: null,
  isRefreshing: false,

  setCurrentView: (view) => set({ currentView: view }),

  setGlobalFilter: (key, value) => {
    set((state) => ({
      globalFilters: { ...state.globalFilters, [key]: value },
    }));
  },

  resetGlobalFilters: () => set({ globalFilters: DEFAULT_FILTERS }),

  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),

  setFirstRunTourStep: (step) => set({ firstRunTourStep: step }),

  updateSettings: (partial) => {
    set((state) => ({
      appSettings: { ...state.appSettings, ...partial },
    }));
  },

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  loadSampleDataset: async () => {
    const parsed = parseDelimitedText(SAMPLE_CSV_RAW);
    await get().loadCustomRecords(parsed.records, 'BritConnect_Sample_Data.csv', false);
  },

  refreshFromServer: async () => {
    set({ isRefreshing: true });
    try {
      const res = await fetch('/api/dataset/current');
      if (res.ok) {
        const data = await res.json();
        if (data?.dataset && Array.isArray(data.dataset.raw) && data.dataset.raw.length > 0) {
          await get().loadCustomRecords(data.dataset.raw, data.dataset.name, false);
          set({
            uploadedAt: data.dataset.uploadedAt,
            isRefreshing: false,
          });
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch shared dataset from server:', err);
    }
    set({ isRefreshing: false });
    return false;
  },

  loadCustomRecords: async (records, name, persistToServer = true) => {
    // 1. Validation & Quality Report
    const qualityReport = validateCustomerDataset(records);

    // 2. Cleaning & Audit Log
    const { cleaned, auditLog } = cleanCustomerDataset(records);

    // 3. Feature Engineering
    const { engineered } = engineerCustomerFeatures(cleaned);

    // 4. Initial Baseline Model Train (Logistic Regression Champion)
    let trainedChampion: ModelTrainedVersion | null = null;
    let scored = engineered;

    try {
      trainedChampion = await trainModelWithCV(
        engineered,
        'logistic_regression',
        'L2 Logistic Regression (Champion)',
        5,
        2
      );
      scored = scoreCustomersWithModel(engineered, trainedChampion);
    } catch (err) {
      console.warn('Initial model training skipped or failed:', err);
    }

    const uploadTimestamp = new Date().toISOString();

    set({
      datasetName: name,
      rawDataset: records,
      cleanDataset: cleaned,
      engineeredDataset: scored,
      qualityReport,
      cleaningAuditLog: auditLog,
      models: trainedChampion ? [trainedChampion] : [],
      championModel: trainedChampion,
      selectedCustomerId: scored[0]?.customerId || null,
      uploadedAt: uploadTimestamp,
    });

    // Persist to Server so any other user opening the shared link sees this dataset
    if (persistToServer) {
      try {
        await fetch('/api/dataset/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, raw: records }),
        });
      } catch (err) {
        console.warn('Could not persist dataset to server:', err);
      }
    }

    // Persist to IndexedDB
    try {
      await saveDatasetToIDB({
        id: `ds-${Date.now()}`,
        name,
        loadedAt: uploadTimestamp,
        rawCount: records.length,
        cleanedCount: cleaned.length,
        raw: records,
        cleaned,
        engineered: scored,
      });
      if (trainedChampion) {
        await saveModelToIDB(trainedChampion);
      }
    } catch (e) {
      console.warn('Could not persist to IDB:', e);
    }
  },

  trainModelAction: async (type: ModelType, name?: string) => {
    const { engineeredDataset, models } = get();
    if (engineeredDataset.length === 0) return;

    set({ isTraining: true, trainingProgress: 0, trainingStatus: 'Initializing cross-validation splits...' });

    try {
      const newModel = await trainModelWithCV(
        engineeredDataset,
        type,
        name || `${type.replace('_', ' ').toUpperCase()} Model`,
        get().appSettings.cvFolds,
        get().appSettings.cvRepeats,
        (pct, msg) => {
          set({ trainingProgress: pct, trainingStatus: msg });
        }
      );

      // Score customers with new model if set as champion
      const updatedModels = [...models, newModel];
      const rescored = scoreCustomersWithModel(engineeredDataset, newModel);

      set({
        models: updatedModels,
        championModel: newModel,
        engineeredDataset: rescored,
        isTraining: false,
        trainingProgress: 100,
        trainingStatus: 'Model training complete!',
      });

      await saveModelToIDB(newModel);
    } catch (error) {
      set({
        isTraining: false,
        trainingStatus: (error as Error).message || 'Training failed',
      });
      alert(`Model Training Error: ${(error as Error).message}`);
    }
  },

  setChampionModelAction: (modelId: string) => {
    const { models, engineeredDataset } = get();
    const targetModel = models.find((m) => m.id === modelId);
    if (!targetModel) return;

    const updatedModels = models.map((m) => ({
      ...m,
      isChampion: m.id === modelId,
    }));

    const rescored = scoreCustomersWithModel(engineeredDataset, targetModel);

    set({
      models: updatedModels,
      championModel: targetModel,
      engineeredDataset: rescored,
    });
  },

  addCampaignAction: async (campaign: RetentionCampaign) => {
    const updated = [campaign, ...get().campaigns];
    set({ campaigns: updated });
    await saveCampaignToIDB(campaign);
  },

  sendChatMessage: async (query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
      isChatLoading: true,
    }));

    const { engineeredDataset, championModel, appSettings } = get();
    const facts = compilePrecomputedFacts(engineeredDataset, championModel);

    const reply = await askAIAnalyst(query, facts, appSettings.allowAiNarrative);

    const botMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: reply.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verified: reply.verified,
      isAi: reply.isAi,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, botMsg],
      isChatLoading: false,
    }));
  },

  clearAllPlatformData: async () => {
    try {
      await fetch('/api/dataset/reset', { method: 'POST' });
    } catch (err) {
      console.warn('Could not reset server dataset:', err);
    }

    await clearAllIDBData();
    set({
      rawDataset: [],
      cleanDataset: [],
      engineeredDataset: [],
      qualityReport: null,
      cleaningAuditLog: [],
      models: [],
      championModel: null,
      campaigns: INITIAL_DEMO_CAMPAIGNS,
      chatMessages: [],
      selectedCustomerId: null,
      uploadedAt: null,
    });
    // Reload initial sample
    await get().loadSampleDataset();
  },

  initApp: async () => {
    // 1. First priority: Check if a shared dataset was uploaded to the server
    const hasShared = await get().refreshFromServer();
    if (hasShared) {
      console.log('[BritConnect] Loaded active shared dataset from server');
      return;
    }

    // 2. Try to restore from local IndexedDB if available
    try {
      const savedDataset = await loadLatestDatasetFromIDB();
      const savedModels = await loadModelsFromIDB();
      const savedCampaigns = await loadCampaignsFromIDB();

      if (savedDataset && savedDataset.engineered.length > 0) {
        const champ = savedModels.find((m) => m.isChampion) || savedModels[0] || null;
        set({
          datasetName: savedDataset.name,
          rawDataset: (savedDataset.raw as Record<string, unknown>[]) || [],
          cleanDataset: savedDataset.cleaned || [],
          engineeredDataset: savedDataset.engineered || [],
          models: savedModels,
          championModel: champ,
          campaigns: savedCampaigns.length > 0 ? savedCampaigns : INITIAL_DEMO_CAMPAIGNS,
          qualityReport: validateCustomerDataset((savedDataset.raw as Record<string, unknown>[]) || []),
          uploadedAt: savedDataset.loadedAt,
        });
        return;
      }
    } catch (err) {
      console.warn('IDB restore failed, bootstrapping sample dataset', err);
    }

    // 3. Default first-run: load embedded reference sample data
    await get().loadSampleDataset();
  },
}));
