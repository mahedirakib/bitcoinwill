import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Trash2,
  Clock,
  Shield,
  AlertTriangle,
  Pencil,
  X,
  Download,
  RefreshCw,
  Activity,
  Tag,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { SavedVault } from '@/lib/vaultStorage';
import { useToast } from '@/components/Toast';
import { useVaults } from '@/hooks/useVaults';
import { calculateTime } from '@/lib/bitcoin/utils';
import { downloadJson } from '@/lib/utils/download';
import { useVaultStatus } from '@/features/recovery/hooks/useVaultStatus';
import { formatBtc, formatSats } from '@/lib/bitcoin/explorer';

interface VaultDetailPageProps {
  vault: SavedVault;
  onBack: () => void;
  onViewInstructions: (vault: SavedVault) => void;
  onDelete: () => void;
}

const DetailRow = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="grid grid-cols-[140px_1fr] gap-4 border-t border-border py-3 first:border-t-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div
      className={`break-all text-sm text-foreground ${
        mono ? 'font-mono text-xs' : ''
      }`}
    >
      {value}
    </div>
  </div>
);

export const VaultDetailPage = ({
  vault,
  onBack,
  onViewInstructions,
  onDelete,
}: VaultDetailPageProps) => {
  const { showToast } = useToast();
  const { renameVault, updateNotes, updateTags, markChecked } = useVaults();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(vault.name);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState(vault.notes || '');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editTags, setEditTags] = useState(vault.tags?.join(', ') || '');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const {
    vaultStatus,
    statusError,
    isCheckingStatus,
    refreshVaultStatus,
  } = useVaultStatus(
    vault.network as 'mainnet' | 'testnet' | 'regtest',
    vault.address
  );

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(vault.address);
      setCopiedAddress(true);
      showToast('Address copied');
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedAddress(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      showToast('Clipboard unavailable');
    }
  };

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== vault.name) {
      renameVault(vault.id, trimmed);
      showToast('Vault renamed');
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(vault.name);
    setIsEditingName(false);
  };

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      vaults: [vault],
    };
    downloadJson(`vault-${vault.address.slice(0, 8)}-backup.json`, exportData);
    showToast('Vault exported');
  };

  const handleSaveNotes = () => {
    updateNotes(vault.id, editNotes);
    setIsEditingNotes(false);
    showToast('Notes saved');
  };

  const handleCancelNotesEdit = () => {
    setEditNotes(vault.notes || '');
    setIsEditingNotes(false);
  };

  const handleSaveTags = () => {
    const tags = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    updateTags(vault.id, tags);
    setIsEditingTags(false);
    showToast('Tags updated');
  };

  const handleCancelTagsEdit = () => {
    setEditTags(vault.tags?.join(', ') || '');
    setIsEditingTags(false);
  };

  const handleRefreshStatus = () => {
    refreshVaultStatus();
    markChecked(vault.id);
  };

  const getExplorerUrl = () => {
    const base =
      vault.network === 'mainnet'
        ? 'https://mempool.space/address/'
        : vault.network === 'testnet'
        ? 'https://mempool.space/testnet/address/'
        : null;
    return base ? `${base}${vault.address}` : null;
  };

  const explorerUrl = getExplorerUrl();
  const plan = vault.plan;
  const result = vault.result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to vaults
        </button>
      </div>

      {/* Vault Title */}
      <div className="space-y-2">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="field-input max-w-md text-lg font-semibold"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="rounded-md p-1.5 text-success hover:bg-success/10"
              aria-label="Save vault name"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Cancel editing vault name"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{vault.name}</h1>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
              aria-label="Edit vault name"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-muted px-2 py-1 text-xs font-medium capitalize">
            <Shield className="h-3 w-3" /> {vault.network}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-muted px-2 py-1 text-xs font-medium">
            {vault.addressType === 'p2tr' ? 'Taproot' : 'P2WSH'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" /> {new Date(vault.createdAt).toLocaleDateString()}
          </span>
          {vault.tags && vault.tags.length > 0 && !isEditingTags && (
            vault.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-sm bg-accent/10 px-2 py-1 text-xs font-medium text-accent-foreground"
              >
                <Tag className="h-3 w-3" /> {tag}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Address + QR */}
      <div className="panel p-5 space-y-4">
        <div className="section-eyebrow">Vault address</div>
        <div className="flex items-center gap-3">
          <code className="flex-1 break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
            {vault.address}
          </code>
          <button
            type="button"
            onClick={handleCopyAddress}
            className="btn-secondary !px-3 !py-2"
            aria-label="Copy address"
          >
            {copiedAddress ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary !px-3 !py-2"
              aria-label="View on explorer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="flex justify-center">
          <div className="rounded-md border border-border bg-white p-3">
            <QRCodeSVG
              value={vault.address}
              size={140}
              bgColor="#ffffff"
              fgColor="#111111"
              level="M"
              title="Vault address QR code"
            />
          </div>
        </div>
      </div>

      {/* Live Status */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="section-eyebrow flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Live status
          </div>
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={isCheckingStatus}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            {isCheckingStatus ? 'Checking…' : 'Refresh'}
          </button>
        </div>

        {statusError && (
          <div className="rounded-md border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
            {statusError}
          </div>
        )}

        {vaultStatus ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-white p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Confirmed balance</p>
              <p className="text-lg font-semibold">{formatBtc(vaultStatus.confirmedBalanceSats)} BTC</p>
              <p className="text-xs text-muted-foreground">{formatSats(vaultStatus.confirmedBalanceSats)} sats</p>
            </div>
            <div className="rounded-md border border-border bg-white p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Total transactions</p>
              <p className="text-lg font-semibold">{vaultStatus.txCount}</p>
              <p className="text-xs text-muted-foreground">
                {vaultStatus.usedFallbackProvider ? 'Via fallback' : 'Direct'}
              </p>
            </div>
            <div className="rounded-md border border-border bg-white p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                {vaultStatus.totalBalanceSats > 0 ? (
                  <span className="text-success">Funded</span>
                ) : (
                  <span className="text-muted-foreground">Empty</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {vaultStatus.totalBalanceSats > 0 ? 'Ready for check-in' : 'Awaiting deposit'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            Click refresh to check vault status on the blockchain
          </div>
        )}
      </div>

      {/* Plan Details */}
      <div className="panel p-5 space-y-4">
        <div className="section-eyebrow">Plan details</div>
        <div className="space-y-0">
          <DetailRow
            label="Recovery type"
            value="Timelock recovery"
          />
          <DetailRow
            label="Inactivity period"
            value={`${plan.locktime_blocks.toLocaleString()} blocks (≈ ${calculateTime(plan.locktime_blocks)})`}
          />
          <DetailRow
            label="Owner key"
            value={`${plan.owner_pubkey.slice(0, 8)}…${plan.owner_pubkey.slice(-8)}`}
            mono
          />
          <DetailRow
            label="Beneficiary"
            value={
              plan.recovery_method === 'social'
                ? `Social recovery (${plan.sss_config?.threshold}-of-${plan.sss_config?.total})`
                : `${plan.beneficiary_pubkey.slice(0, 8)}…${plan.beneficiary_pubkey.slice(-8)}`
            }
            mono
          />
          <DetailRow
            label="Descriptor"
            value={result.descriptor}
            mono
          />
        </div>
      </div>

      {/* Notes */}
      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="section-eyebrow">Notes</div>
          {!isEditingNotes && (
            <button
              type="button"
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              className="field-input h-24 resize-none text-sm"
              placeholder="Add notes about this vault..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="btn-primary text-xs"
              >
                Save notes
              </button>
              <button
                type="button"
                onClick={handleCancelNotesEdit}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : vault.notes ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{vault.notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No notes yet. Click edit to add notes about this vault.
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="section-eyebrow flex items-center gap-1.5">
            <Tag className="h-3 w-3" /> Tags
          </div>
          {!isEditingTags && (
            <button
              type="button"
              onClick={() => setIsEditingTags(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingTags ? (
          <div className="space-y-2">
            <input
              type="text"
              className="field-input text-sm"
              placeholder="Enter tags separated by commas..."
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTags();
                if (e.key === 'Escape') handleCancelTagsEdit();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas (e.g., family, savings, 2025)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveTags}
                className="btn-primary text-xs"
              >
                Save tags
              </button>
              <button
                type="button"
                onClick={handleCancelTagsEdit}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : vault.tags && vault.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {vault.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-sm bg-accent/10 px-2.5 py-1 text-sm font-medium text-accent-foreground"
              >
                <Tag className="h-3 w-3" /> {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No tags yet. Click edit to add tags for organizing this vault.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onViewInstructions(vault)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" /> View instructions
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" /> Export vault
        </button>
      </div>

      {/* Danger zone */}
      <div className="panel border-danger/20 p-5 space-y-3">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-semibold">Danger zone</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Deleting a vault removes it from this device only. The actual Bitcoin on the network is unaffected.
        </p>
        
        {showDeleteConfirm ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-danger">Are you sure?</p>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-white hover:bg-danger/90"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 text-sm text-danger hover:underline"
          >
            <Trash2 className="h-4 w-4" /> Delete this vault
          </button>
        )}
      </div>
    </div>
  );
};
