import { useState, useRef, useMemo } from 'react';
import {
  Trash2,
  ExternalLink,
  Pencil,
  Check,
  X,
  FolderClosed,
  Plus,
  Clock,
  Shield,
  Search,
  Download,
  Upload,
  FileText,
  ArrowUpDown,
  BarChart3,
  Tag,
} from 'lucide-react';
import type { SavedVault } from '@/lib/vaultStorage';
import { useVaults } from '@/hooks/useVaults';
import { useToast } from '@/components/Toast';
import { downloadJson } from '@/lib/utils/download';
import type { NavView } from '@/components/AppShell';

type SortOption = 'newest' | 'oldest' | 'name' | 'network';
type NetworkFilter = 'all' | 'mainnet' | 'testnet' | 'regtest';
type TagFilter = 'all' | string;

interface VaultsPageProps {
  onNavigate: (view: NavView) => void;
  onViewVault: (vault: SavedVault) => void;
}

const VaultCard = ({
  vault,
  onView,
  onDelete,
  onRename,
}: {
  vault: SavedVault;
  onView: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(vault.name);

  const handleSaveName = () => {
    onRename(editName.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(vault.name);
    setIsEditing(false);
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

  return (
    <div className="group panel p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="field-input flex-1 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="rounded-md p-1 text-success hover:bg-success/10"
                aria-label="Save name"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Cancel editing"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{vault.name}</h3>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                aria-label="Edit name"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(vault.createdAt).toLocaleDateString()}
            </span>
            <span className="capitalize">{vault.network}</span>
            <span>{vault.addressType === 'p2tr' ? 'Taproot' : 'P2WSH'}</span>
            {vault.lastCheckedAt && (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="h-3 w-3" />
                Checked {new Date(vault.lastCheckedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {vault.tags && vault.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {vault.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-foreground"
                >
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="View on explorer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger"
            aria-label="Delete vault"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <code className="flex-1 truncate font-mono text-xs text-foreground">{vault.address}</code>
          <button
            type="button"
            onClick={onView}
            className="whitespace-nowrap text-xs font-medium text-foreground hover:underline"
          >
            View details →
          </button>
        </div>
      </div>
    </div>
  );
};

const VaultStatistics = ({ vaults }: { vaults: SavedVault[] }) => {
  const stats = useMemo(() => {
    const byNetwork = vaults.reduce((acc, vault) => {
      acc[vault.network] = (acc[vault.network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = vaults.reduce((acc, vault) => {
      const type = vault.addressType === 'p2tr' ? 'Taproot' : 'P2WSH';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { byNetwork, byType, total: vaults.length };
  }, [vaults]);

  if (stats.total === 0) return null;

  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Overview</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">By network</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byNetwork).map(([network, count]) => (
              <span
                key={network}
                className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs capitalize"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    network === 'mainnet'
                      ? 'bg-danger'
                      : network === 'testnet'
                      ? 'bg-success'
                      : 'bg-muted-foreground'
                  }`}
                />
                {network} ({count})
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">By type</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs"
              >
                {type} ({count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const VaultsPage = ({ onNavigate, onViewVault }: VaultsPageProps) => {
  const { vaults, removeVault, renameVault, exportAllVaults, importVaults } = useVaults();
  const { showToast } = useToast();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>('all');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAndSortedVaults = useMemo(() => {
    let result = [...vaults];

    // Apply network filter
    if (networkFilter !== 'all') {
      result = result.filter((vault) => vault.network === networkFilter);
    }

    // Apply tag filter
    if (tagFilter !== 'all') {
      result = result.filter((vault) =>
        vault.tags?.some((tag) => tag === tagFilter)
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (vault) =>
          vault.name.toLowerCase().includes(query) ||
          vault.address.toLowerCase().includes(query) ||
          vault.network.toLowerCase().includes(query) ||
          vault.tags?.some((tag) => tag.includes(query)) ||
          false
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'network':
          return a.network.localeCompare(b.network) || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [vaults, networkFilter, tagFilter, searchQuery, sortBy]);

  const availableNetworks = useMemo(() => {
    const networks = new Set(vaults.map((v) => v.network));
    return Array.from(networks).sort();
  }, [vaults]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    vaults.forEach((v) => v.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [vaults]);

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      removeVault(id);
      setDeleteConfirmId(null);
      showToast('Vault removed');
    } else {
      setDeleteConfirmId(id);
      showToast('Click delete again to confirm');
    }
  };

  const handleViewVault = (vault: SavedVault) => {
    onViewVault(vault);
  };

  const handleExport = () => {
    const json = exportAllVaults();
    try {
      const data = JSON.parse(json);
      downloadJson('bitcoin-will-vaults-backup.json', data);
      showToast('Vaults exported');
    } catch {
      showToast('Failed to export vaults');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) {
      showToast('Paste JSON to import');
      return;
    }
    const result = importVaults(importText);
    if (result.imported > 0) {
      showToast(`Imported ${result.imported} vault${result.imported > 1 ? 's' : ''}`);
    }
    if (result.skipped > 0) {
      showToast(`${result.skipped} vault${result.skipped > 1 ? 's' : ''} already exist`);
    }
    if (result.errors.length > 0) {
      showToast(`Import errors: ${result.errors.join(', ')}`);
    }
    setImportText('');
    setShowImport(false);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importVaults(text);
      if (result.imported > 0) {
        showToast(`Imported ${result.imported} vault${result.imported > 1 ? 's' : ''}`);
      }
      if (result.skipped > 0) {
        showToast(`${result.skipped} vault${result.skipped > 1 ? 's' : ''} already exist`);
      }
      if (result.errors.length > 0) {
        showToast(`Import errors: ${result.errors.join(', ')}`);
      }
    } catch {
      showToast('Error reading file');
    } finally {
      event.target.value = '';
    }
  };

  if (vaults.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <FolderClosed className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No saved vaults yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create a vault to save it here for quick access to status checks and recovery options.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('create')}
              className="btn-accent"
            >
              <Plus className="h-4 w-4" /> Create your first vault
            </button>
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="btn-secondary"
            >
              <Upload className="h-4 w-4" /> Import
            </button>
          </div>
        </div>

        {showImport && (
          <div className="panel space-y-3 p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Import vaults</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a backup JSON or recovery kit to import vaults.
            </p>
            <label
              htmlFor="import-file"
              className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border-strong bg-muted/40 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Upload className="mr-2 h-4 w-4" /> Choose backup file
              <input
                id="import-file"
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleFileImport}
              />
            </label>
            <p className="text-center text-xs text-muted-foreground">or paste JSON</p>
            <textarea
              className="field-input h-24 resize-none text-xs"
              placeholder="Paste backup JSON here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={!importText.trim()}
                className="btn-primary flex-1"
              >
                Import
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportText('');
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Local storage',
              desc: 'Vaults are stored only on your device. We never see your data.',
            },
            {
              icon: Clock,
              title: 'Quick access',
              desc: 'Check vault status or initiate recovery without uploading files.',
            },
            {
              icon: FolderClosed,
              title: 'Organize',
              desc: 'Name your vaults and keep track of multiple inheritance plans.',
            },
          ].map((feature) => (
            <div key={feature.title} className="panel p-5 text-center">
              <feature.icon className="mx-auto h-5 w-5 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Saved vaults ({vaults.length})</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary"
            title="Export all vaults as JSON backup"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="btn-secondary"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="btn-accent"
          >
            <Plus className="h-4 w-4" /> New vault
          </button>
        </div>
      </div>

      {/* Statistics */}
      <VaultStatistics vaults={vaults} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, address, or network..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="field-input pl-9"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showImport && (
        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Import vaults</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowImport(false);
                setImportText('');
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Import a backup JSON or recovery kit. Existing vaults will be skipped.
          </p>
          <label
            htmlFor="import-file"
            className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border-strong bg-muted/40 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Upload className="mr-2 h-4 w-4" /> Choose file
            <input
              id="import-file"
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileImport}
            />
          </label>
          <p className="text-center text-xs text-muted-foreground">or paste JSON</p>
          <textarea
            className="field-input h-24 resize-none text-xs"
            placeholder="Paste backup JSON here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="btn-primary w-full"
          >
            Import vaults
          </button>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Network filter */}
          <div className="flex flex-wrap gap-1">
            {(['all', ...availableNetworks] as NetworkFilter[]).map((network) => (
              <button
                key={network}
                type="button"
                onClick={() => setNetworkFilter(network)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  networkFilter === network
                    ? 'bg-foreground text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {network === 'all' ? 'All' : network}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-md border border-border bg-white px-2 py-1 text-xs font-medium text-foreground focus:border-foreground focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name</option>
              <option value="network">Network</option>
            </select>
          </div>
        </div>

        {/* Tag filter */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setTagFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  tagFilter === 'all'
                    ? 'bg-accent text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All tags
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tag)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    tagFilter === tag
                      ? 'bg-accent text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredAndSortedVaults.length === 0 ? (
        <div className="panel py-12 text-center">
          <Search className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || networkFilter !== 'all'
              ? 'No vaults match your filters'
              : 'No vaults yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedVaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onView={() => handleViewVault(vault)}
              onDelete={() => handleDelete(vault.id)}
              onRename={(name) => {
                renameVault(vault.id, name);
                showToast('Vault renamed');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
