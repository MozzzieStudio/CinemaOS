/**
 * useAgentChat - React hook for agent conversations
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type {
  AgentRole,
  AgentContext,
  ChatMessage,
  FullAgentRequest,
  FullAgentResponse,
  AgentAction,
  ActionResult,
} from '../types/agents';

interface UseAgentChatOptions {
  /** Initial agent role */
  initialRole?: AgentRole;
  /** Auto-execute actions returned by agent */
  autoExecute?: boolean;
  /** LLM provider override */
  provider?: string;
  /** Model override */
  model?: string;
}

interface UseAgentChatReturn {
  /** Current conversation messages */
  messages: ChatMessage[];
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Last error message */
  error: string | null;
  /** Current agent role */
  agentRole: AgentRole;
  /** Last response from agent */
  lastResponse: FullAgentResponse | null;
  /** Pending actions to execute */
  pendingActions: AgentAction[];
  /** Results from executed actions */
  actionResults: ActionResult[];
  /** Send a message to the agent */
  sendMessage: (message: string, context?: AgentContext) => Promise<FullAgentResponse | null>;
  /** Change the active agent */
  setAgentRole: (role: AgentRole) => void;
  /** Clear conversation history */
  clearHistory: () => void;
  /** Execute a single action */
  executeAction: (action: AgentAction) => Promise<ActionResult>;
  /** Execute all pending actions */
  executeAllActions: () => Promise<ActionResult[]>;
}

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const {
    initialRole = 'showrunner',
    autoExecute = false,
    provider,
    model,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentRole, setAgentRole] = useState<AgentRole>(initialRole);
  const [lastResponse, setLastResponse] = useState<FullAgentResponse | null>(null);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);

  const sendMessage = useCallback(
    async (message: string, context?: AgentContext): Promise<FullAgentResponse | null> => {
      setIsLoading(true);
      setError(null);

      // Add user message to history
      const userMessage: ChatMessage = { role: 'user', content: message };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const request: FullAgentRequest = {
          agent_role: agentRole,
          message,
          context,
          history: messages,
          provider,
          model,
          auto_execute: autoExecute,
        };

        const response = await invoke<FullAgentResponse>('agent_chat_full', { request });

        // Add assistant message to history
        const assistantMessage: ChatMessage = { role: 'assistant', content: response.message };
        setMessages((prev) => [...prev, assistantMessage]);

        setLastResponse(response);
        setPendingActions(response.actions);
        setActionResults(response.action_results);

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [agentRole, messages, provider, model, autoExecute]
  );

  const executeAction = useCallback(async (action: AgentAction): Promise<ActionResult> => {
    try {
      const result = await invoke<ActionResult>('execute_agent_action', { action });
      setActionResults((prev) => [...prev, result]);
      // Remove from pending
      setPendingActions((prev) => prev.filter((a) => a !== action));
      return result;
    } catch (err) {
      const errorResult: ActionResult = {
        success: false,
        action_type: action.type,
        error: err instanceof Error ? err.message : String(err),
      };
      setActionResults((prev) => [...prev, errorResult]);
      return errorResult;
    }
  }, []);

  const executeAllActions = useCallback(async (): Promise<ActionResult[]> => {
    try {
      const results = await invoke<ActionResult[]>('execute_agent_actions', {
        actions: pendingActions,
      });
      setActionResults((prev) => [...prev, ...results]);
      setPendingActions([]);
      return results;
    } catch (err) {
      const errorResult: ActionResult = {
        success: false,
        action_type: 'batch',
        error: err instanceof Error ? err.message : String(err),
      };
      return [errorResult];
    }
  }, [pendingActions]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
    setPendingActions([]);
    setActionResults([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    agentRole,
    lastResponse,
    pendingActions,
    actionResults,
    sendMessage,
    setAgentRole,
    clearHistory,
    executeAction,
    executeAllActions,
  };
}

export default useAgentChat;
