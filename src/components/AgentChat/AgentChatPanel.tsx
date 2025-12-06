/**
 * AgentChatPanel - Sidebar panel for agent conversations
 */

import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { useAgentChat } from '../../hooks/useAgentChat';
import { AGENT_ROLES, type AgentRole, type AgentContext } from '../../types/agents';
import './AgentChatPanel.css';

interface AgentChatPanelProps {
  /** Current context to send with messages */
  context?: AgentContext;
  /** Callback when script should be updated */
  onUpdateScript?: (content: string, mode: string) => void;
  /** Initial collapsed state */
  initialCollapsed?: boolean;
}

export const AgentChatPanel: FC<AgentChatPanelProps> = ({
  context,
  onUpdateScript,
  initialCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [input, setInput] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    error,
    agentRole,
    pendingActions,
    sendMessage,
    setAgentRole,
    clearHistory,
    executeAction,
  } = useAgentChat({
    autoExecute: false,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (!isCollapsed) {
      inputRef.current?.focus();
    }
  }, [isCollapsed]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message, context);
  }, [input, isLoading, sendMessage, context]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleActionClick = useCallback(async (action: typeof pendingActions[0]) => {
    const result = await executeAction(action);
    
    if (result.success && result.data && action.type === 'UpdateScript') {
      const data = JSON.parse(result.data);
      onUpdateScript?.(data.content, data.mode);
    }
  }, [executeAction, onUpdateScript]);

  const currentAgent = AGENT_ROLES[agentRole];

  if (isCollapsed) {
    return (
      <button
        className="agent-chat-collapsed"
        onClick={() => setIsCollapsed(false)}
        title="Open AI Assistant"
      >
        <span className="agent-icon">{currentAgent.icon}</span>
      </button>
    );
  }

  return (
    <div className="agent-chat-panel">
      {/* Header */}
      <div className="agent-chat-header">
        <button
          className="agent-selector"
          onClick={() => setShowRoleMenu(!showRoleMenu)}
        >
          <span className="agent-icon">{currentAgent.icon}</span>
          <span className="agent-name">{currentAgent.name}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        
        <div className="header-actions">
          <button onClick={clearHistory} title="Clear chat" className="icon-btn">
            🗑️
          </button>
          <button onClick={() => setIsCollapsed(true)} title="Collapse" className="icon-btn">
            ✕
          </button>
        </div>

        {/* Role dropdown */}
        {showRoleMenu && (
          <div className="role-menu">
            {(Object.keys(AGENT_ROLES) as AgentRole[]).map((role) => (
              <button
                key={role}
                className={`role-option ${role === agentRole ? 'active' : ''}`}
                onClick={() => {
                  setAgentRole(role);
                  setShowRoleMenu(false);
                }}
              >
                <span className="agent-icon">{AGENT_ROLES[role].icon}</span>
                <div className="role-info">
                  <span className="role-name">{AGENT_ROLES[role].name}</span>
                  <span className="role-desc">{AGENT_ROLES[role].description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="agent-chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">{currentAgent.icon}</span>
            <p>Ask {currentAgent.name} for help</p>
            <p className="empty-hint">{currentAgent.description}</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <span className="message-icon">{currentAgent.icon}</span>
            )}
            <div className="message-content">{msg.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <span className="message-icon">{currentAgent.icon}</span>
            <div className="message-content">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <div className="pending-actions">
            <p className="actions-label">Suggested Actions:</p>
            {pendingActions.map((action, i) => (
              <button
                key={i}
                className="action-btn"
                onClick={() => handleActionClick(action)}
              >
                {action.type === 'UpdateScript' && '✏️ Apply Script Changes'}
                {action.type === 'GenerateImage' && '🖼️ Generate Image'}
                {action.type === 'GenerateVideo' && '🎬 Generate Video'}
                {action.type === 'AddToCanvas' && '📌 Add to Canvas'}
                {action.type === 'UpdateVault' && '💾 Save to Vault'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="agent-chat-input">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${currentAgent.name}...`}
          disabled={isLoading}
          rows={2}
        />
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? '...' : '→'}
        </button>
      </div>

      {/* Context indicator */}
      {context && (
        <div className="context-indicator">
          {context.script?.selection && (
            <span title="Selected text">📝 Selection</span>
          )}
          {context.canvas?.selected_nodes.length ? (
            <span title="Canvas selection">🎨 Canvas</span>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AgentChatPanel;
