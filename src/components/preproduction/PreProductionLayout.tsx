/**
 * PreProduction Layout — Premium Visual Bible
 * 
 * Features:
 * - Glassmorphism sidebar
 * - Animated token cards
 * - Extract Vault with AI
 */

import { useState, useEffect } from 'react';
import { TokenType, Token, getTokenIcon } from '../../types/tokens';
import TokenCard from './TokenCard';
import TokenEditor from './TokenEditor';
import { invoke } from "@tauri-apps/api/core";

interface PreProductionLayoutProps {
  projectId: string;
}

type ViewMode = 'grid' | 'list';

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

  // Fetch tokens on mount
  useEffect(() => {
    async function fetchTokens() {
      try {
        const result = await invoke<Token[]>('get_tokens', { projectId });
        setTokens(result);
      } catch (e) {
        console.error('Failed to fetch tokens:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTokens();
  }, [projectId]);

  const filteredTokens = tokens.filter(t => t.token_type === activeTab);
  const activeTabInfo = TABS.find(t => t.type === activeTab)!;

  // Handlers
  const handleCreateToken = async (token: Token) => {
    try {
      const created = await invoke<Token>('create_token', {
        projectId,
        tokenType: token.token_type,
        name: token.name,
        description: token.description,
      });
      setTokens([...tokens, created]);
      setIsCreating(false);
    } catch (e) {
      console.error('Failed to create token:', e);
    }
  };

  const handleUpdateToken = async (token: Token) => {
    try {
      const updated = await invoke<Token>('update_token', { token });
      setTokens(tokens.map(t => t.id === updated.id ? updated : t));
      setSelectedToken(null);
    } catch (e) {
      console.error('Failed to update token:', e);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      await invoke('delete_token', { tokenId });
      setTokens(tokens.filter(t => t.id !== tokenId));
      setSelectedToken(null);
    } catch (e) {
      console.error('Failed to delete token:', e);
    }
  };

  const handleGenerateVisual = async (tokenId: string) => {
    // TODO: Connect to ComfyUI
    console.log('Generate visual for:', tokenId);
  };

  const handleExtractVault = async () => {
    setIsExtracting(true);
    // TODO: Get script content and call AI extraction
    setTimeout(() => setIsExtracting(false), 2000);
  };

  return (
    <div className="flex h-full bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[var(--color-border)] flex flex-col glass-strong">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <span className="text-lg">📚</span>
            Visual Bible
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {tokens.length} tokens in vault
          </p>
        </div>
        
        {/* Tab Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(tab => {
            const count = tokens.filter(t => t.token_type === tab.type).length;
            const isActive = activeTab === tab.type;
            
            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30`
                    : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white'
                }`}
                style={isActive ? {
                  background: `rgba(var(--${tab.color}-rgb, 139, 92, 246), 0.15)`,
                  borderColor: `rgba(var(--${tab.color}-rgb, 139, 92, 246), 0.3)`,
                } : {}}
              >
                <span className="text-lg">{getTokenIcon(tab.type)}</span>
                <span className="flex-1 text-left">{tab.label}</span>
                {count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="p-3 border-t border-[var(--color-border)] space-y-2">
          <button
            onClick={handleExtractVault}
            disabled={isExtracting}
            className="w-full btn-primary justify-center"
          >
            {isExtracting ? (
              <>
                <div className="spinner w-4 h-4"></div>
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
            className="w-full btn-secondary justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add {activeTab}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTokenIcon(activeTab)}</span>
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {activeTabInfo.label}
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                {filteredTokens.length} {activeTab.toLowerCase()}s in this project
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-[var(--color-bg-primary)] rounded-lg p-1 border border-[var(--color-border)]">
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
                    ? 'aspect-square rounded-lg skeleton' 
                    : 'h-16 rounded-lg skeleton'
                }`} />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="text-4xl">{getTokenIcon(activeTab)}</span>
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                No {activeTab.toLowerCase()}s yet
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-6">
                Add {activeTab.toLowerCase()}s manually or extract them from your script using AI.
              </p>
              <div className="flex gap-3">
                <button onClick={handleExtractVault} className="btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Extract from Script
                </button>
                <button onClick={() => setIsCreating(true)} className="btn-secondary">
                  Add Manually
                </button>
              </div>
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
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
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
        <div className="animate-fade-in">
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
        </div>
      )}
    </div>
  );
}
