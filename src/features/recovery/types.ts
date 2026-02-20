import type { InstructionModel, RecoveryKitData } from '@/lib/bitcoin/instructions';
import type {
  AddressSummary,
  BroadcastTransactionResult,
  ExplorerProvider
} from '@/lib/bitcoin/explorer';
import type { CheckInPlan } from '@/lib/bitcoin/checkin';

export type { RecoveryKitData };

export interface UseVaultStatusReturn {
  vaultStatus: AddressSummary | null;
  statusError: string | null;
  isCheckingStatus: boolean;
  explorerProvider: ExplorerProvider;
  setExplorerProvider: (provider: ExplorerProvider) => void;
  refreshVaultStatus: () => Promise<void>;
  clearVaultStatus: () => void;
}

export interface UseTransactionBroadcastReturn {
  rawTxHex: string;
  setRawTxHex: (value: string) => void;
  broadcastResult: BroadcastTransactionResult | null;
  broadcastError: string | null;
  isBroadcasting: boolean;
  broadcastMainnetPhrase: string;
  setBroadcastMainnetPhrase: (value: string) => void;
  broadcastTransaction: () => Promise<void>;
  clearBroadcastState: () => void;
}

export interface UseCheckInPlanReturn {
  checkInCadence: number;
  setCheckInCadence: (value: number) => void;
  checkInPlan: CheckInPlan | null;
}

export interface RecoveryPageProps {
  initialData?: RecoveryKitData;
  onBack: () => void;
}

export interface RecoveryKitLoaderProps {
  onLoad: (model: InstructionModel) => void;
  onBack: () => void;
  onSocialRecovery?: () => void;
}

export interface VaultStatusPanelProps {
  model: InstructionModel;
  vaultStatus: AddressSummary | null;
  statusError: string | null;
  isCheckingStatus: boolean;
  explorerProvider: ExplorerProvider;
  onProviderChange: (provider: ExplorerProvider) => void;
  onRefresh: () => void;
}

export interface CheckInPanelProps {
  model: InstructionModel;
  vaultStatus: AddressSummary | null;
  checkInPlan: CheckInPlan | null;
  checkInCadence: number;
  onCadenceChange: (value: number) => void;
}

export interface BroadcastPanelProps {
  model: InstructionModel;
  rawTxHex: string;
  onRawTxHexChange: (value: string) => void;
  broadcastResult: BroadcastTransactionResult | null;
  broadcastError: string | null;
  isBroadcasting: boolean;
  broadcastMainnetPhrase: string;
  onBroadcastMainnetPhraseChange: (value: string) => void;
  onBroadcast: () => void;
  reconstructedKey?: string | null;
}

import { ReactNode } from 'react';

export interface InstructionsViewProps {
  model: InstructionModel;
  onDownloadTxt: () => void;
  onPrint: () => void;
  onBack: () => void;
  children?: ReactNode;
}
