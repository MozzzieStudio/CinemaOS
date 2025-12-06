/**
 * PreProduction Layout — Premium Visual Bible
 * 
 * Features:
 * - Glassmorphism sidebar
 * - Animated token cards
 * - Extract Vault with AI
 * - Search & Filter
 * - Statistics Panel
 * - Keyboard shortcuts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TokenType, Token, getTokenIcon } from '../../types/tokens';
import TokenCard from './TokenCard';
import TokenEditor from './TokenEditor';
import { safeInvoke } from '../../utils/tauriMock';
import { toast } from 'sonner';
import { downloadVisualBible } from '../../lib/visualBibleExport';

interface PreProductionLayoutProps {
  projectId: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'hasVisual';

const TABS: { type: TokenType; label: string; color: string }[] = [
  { type: 'Character', label: 'Characters', color: 'purple' },
  { type: 'Location', label: 'Locations', color: 'emerald' },
  { type: 'Prop', label: 'Props', color: 'amber' },
  { type: 'Set', label: 'Sets', color: 'blue' },
];

export default function PreProductionLayout({ projectId }: PreProductionLayoutProps) {
  const [activeTab, setActiveTab] = useState<TokenType>('Character');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for search/sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Fetch tokens on mount
  useEffect(() => {
    async function fetchTokens() {
      try {
        const result = await safeInvoke<Token[]>('get_tokens', { projectId });
        setTokens(result);
        toast.success(`Loaded ${result.length} tokens`);
      } catch (e) {
        console.error('Failed to fetch tokens:', e);
        toast.error('Failed to load tokens');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTokens();
  }, [projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New token
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreating(true);
      }
      // Ctrl+E: Extract from script
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExtractVault();
      }
      // Escape: Close modal
      if (e.key === 'Escape') {
        setSelectedToken(null);
        setIsCreating(false);
      }
      // Ctrl+F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('vault-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered and sorted tokens
  const filteredTokens = useMemo(() => {
    let result = tokens.filter(t => t.token_type === activeTab);
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'hasVisual':
          return (b.visual_refs.length > 0 ? 1 : 0) - (a.visual_refs.length > 0 ? 1 : 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [tokens, activeTab, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const byType = TABS.map(tab => ({
      type: tab.type,
      count: tokens.filter(t => t.token_type === tab.type).length,
      withVisual: tokens.filter(t => t.token_type === tab.type && t.visual_refs.length > 0).length,
    }));
    const total = tokens.length;
    const withVisuals = tokens.filter(t => t.visual_refs.length > 0).length;
    const withLora = tokens.filter(t => t.lora_id).length;
    return { byType, total, withVisuals, withLora };
  }, [tokens]);

  const activeTabInfo = TABS.find(t => t.type === activeTab)!;

  // Handlers
  const handleCreateToken = async (token: Token) => {
    try {
      const created = await safeInvoke<Token>('create_token', {
        projectId,
        tokenType: token.token_type,
        name: token.name,
        description: token.description,
      });
      setTokens([...tokens, created]);
      setIsCreating(false);
      toast.success(`Created ${token.token_type}: ${token.name}`);
    } catch (e) {
      console.error('Failed to create token:', e);
      toast.error('Failed to create token');
    }
  };

  const handleUpdateToken = async (token: Token) => {
    try {
      const updated = await safeInvoke<Token>('update_token', { token });
      setTokens(tokens.map(t => t.id === updated.id ? updated : t));
      setSelectedToken(null);
      toast.success(`Updated ${token.name}`);
    } catch (e) {
      console.error('Failed to update token:', e);
      toast.error('Failed to update token');
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      await safeInvoke('delete_token', { tokenId });
      setTokens(tokens.filter(t => t.id !== tokenId));
      setSelectedToken(null);
      toast.success('Token deleted');
    } catch (e) {
      console.error('Failed to delete token:', e);
      toast.error('Failed to delete token');
    }
  };

  const handleGenerateVisual = useCallback(async (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;

    toast.loading(`Generating visual for ${token.name}...`, { id: tokenId });

    try {
      const mockImage = `https://placehold.co/1024x576/1a1a1a/FFF?text=${encodeURIComponent(token.name)}`;
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updated = await safeInvoke<Token>('add_token_visual', { 
        tokenId, 
        visualUrl: mockImage 
      });

      setTokens(tokens.map(t => t.id === tokenId ? updated : t));
      toast.success(`Visual generated for ${token.name}`, { id: tokenId });
    } catch (e) {
      console.error('Failed to generate visual:', e);
      toast.error(`Failed to generate visual`, { id: tokenId });
    }
  }, [tokens]);

  const handleExtractVault = useCallback(async () => {
    setIsExtracting(true);
    toast.loading('Extracting entities from script...', { id: 'extract' });
    
    try {
      const script = await safeInvoke<any>('load_script', { projectId });
      if (!script || !script.content) {
        toast.warning("No script content found. Write something first!", { id: 'extract' });
        setIsExtracting(false);
        return;
      }

      let scriptText = '';
      try {
          const json = JSON.parse(script.content);
          const traverse = (node: any) => {
            if (node.text) scriptText += node.text;
            if (['scene-heading', 'action', 'character', 'dialogue', 'transition'].includes(node.type)) {
              scriptText += '\n';
            }
            if (node.children && Array.isArray(node.children)) {
              node.children.forEach(traverse);
            }
            if (node.type === 'linebreak') scriptText += '\n';
          };
          if (json.root) traverse(json.root);
      } catch {
          scriptText = script.content;
      }

      const extracted = await safeInvoke<any>('extract_tokens_from_script', {
        projectId,
        scriptContent: scriptText
      });

      const saved = await safeInvoke<Token[]>('save_extracted_tokens', {
        projectId,
        extracted
      });

      if (saved.length > 0) {
        const currentIds = new Set(tokens.map(t => t.id));
        const newTokens = saved.filter(t => !currentIds.has(t.id));
        setTokens(prev => [...prev, ...newTokens]);
        toast.success(`Extracted ${saved.length} entities!`, { id: 'extract' });
      } else {
        toast.info('No new entities found', { id: 'extract' });
      }
    } catch (e) {
      console.error("Extraction failed:", e);
      toast.error('Extraction failed', { id: 'extract' });
    } finally {
      setIsExtracting(false);
    }
  }, [projectId, tokens]);

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0f0f0f]">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
            <span className="text-lg">📚</span>
            Visual Bible
          </h2>
          <p className="text-xs text-white/40 mt-1">
            {stats.total} tokens • {stats.withVisuals} with visuals
          </p>
        </div>
        
        {/* Stats Panel */}
        <div className="p-3 border-b border-white/10 space-y-2">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Statistics</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-white">{stats.total}</div>
              <div className="text-[10px] text-white/40">Total</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-emerald-400">{stats.withVisuals}</div>
              <div className="text-[10px] text-white/40">Visualized</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-purple-400">{stats.withLora}</div>
              <div className="text-[10px] text-white/40">LoRA Ready</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-400">
                {stats.total > 0 ? Math.round((stats.withVisuals / stats.total) * 100) : 0}%
              </div>
              <div className="text-[10px] text-white/40">Coverage</div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(tab => {
            const tabStats = stats.byType.find(s => s.type === tab.type);
            const isActive = activeTab === tab.type;
            
            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-lg">{getTokenIcon(tab.type)}</span>
                <span className="flex-1 text-left">{tab.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                  {tabStats?.count || 0}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            onClick={handleExtractVault}
            disabled={isExtracting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Extracting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Extract from Script
              </>
            )}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 font-medium text-sm hover:bg-white/10 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add {activeTab}
          </button>
          <button
            onClick={async () => {
              const toastId = 'export-bible';
              toast.loading('Generating Visual Bible PDF...', { id: toastId });
              try {
                await downloadVisualBible(tokens);
                toast.success('Visual Bible exported!', { id: toastId });
              } catch (e) {
                console.error('Export failed:', e);
                toast.error('Export failed', { id: toastId });
              }
            }}
            disabled={tokens.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-medium text-sm hover:bg-emerald-600/30 transition-all disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Bible
          </button>
        </div>
        
        {/* Keyboard Hints */}
        <div className="p-3 border-t border-white/10 text-[10px] text-white/30 space-y-1">
          <div><kbd className="px-1 py-0.5 bg-white/10 rounded">Ctrl+N</kbd> New token</div>
          <div><kbd className="px-1 py-0.5 bg-white/10 rounded">Ctrl+E</kbd> Extract</div>
          <div><kbd className="px-1 py-0.5 bg-white/10 rounded">Ctrl+F</kbd> Search</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTokenIcon(activeTab)}</span>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {activeTabInfo.label}
              </h1>
              <p className="text-xs text-white/40">
                {filteredTokens.length} {activeTab.toLowerCase()}s{searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                id="vault-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-48 pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="hasVisual">Sort by Visual</option>
            </select>
            
            {/* View Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Token Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            // Loading Skeleton
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-3'
            }>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`animate-pulse ${
                  viewMode === 'grid' 
                    ? 'aspect-square rounded-lg bg-white/5' 
                    : 'h-16 rounded-lg bg-white/5'
                }`} />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <span className="text-5xl opacity-50">{getTokenIcon(activeTab)}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No results found' : `No ${activeTab.toLowerCase()}s yet`}
              </h3>
              <p className="text-sm text-white/40 max-w-sm mb-6">
                {searchQuery 
                  ? `No tokens matching "${searchQuery}"` 
                  : `Add ${activeTab.toLowerCase()}s manually or extract them from your script using AI.`
                }
              </p>
              {!searchQuery && (
                <div className="flex gap-3">
                  <button onClick={handleExtractVault} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Extract from Script
                  </button>
                  <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm font-medium transition-colors">
                    Add Manually
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Token Grid
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'space-y-3'
            }>
              {filteredTokens.map((token, index) => (
                <div 
                  key={token.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TokenCard
                    token={token}
                    viewMode={viewMode}
                    onClick={() => setSelectedToken(token)}
                    onGenerateVisual={() => handleGenerateVisual(token.id!)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Token Editor Modal */}
      {(selectedToken || isCreating) && (
        <TokenEditor
          token={selectedToken}
          tokenType={activeTab}
          projectId={projectId}
          onSave={selectedToken ? handleUpdateToken : handleCreateToken}
          onDelete={selectedToken?.id ? () => handleDeleteToken(selectedToken.id!) : undefined}
          onClose={() => {
            setSelectedToken(null);
            setIsCreating(false);
          }}
          onGenerateVisual={selectedToken?.id ? () => handleGenerateVisual(selectedToken.id!) : undefined}
        />
      )}
    </div>
  );
}
