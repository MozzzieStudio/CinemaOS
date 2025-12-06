/**
 * useAgentActions - Hook for handling agent action execution
 */

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AgentAction, ActionResult } from '../types/agents';

interface ActionHandler {
  /** Handle UpdateScript action */
  onUpdateScript?: (content: string, mode: string, lineStart?: number, lineEnd?: number) => void;
  /** Handle AddToCanvas action */
  onAddToCanvas?: (nodeType: string, content: string, position?: [number, number]) => void;
  /** Handle ShowMessage action */
  onShowMessage?: (title: string, content: string, suggestions: string[]) => void;
  /** Handle generation started */
  onGenerationStarted?: (executionId: string, type: 'image' | 'video' | 'audio') => void;
}

interface UseAgentActionsReturn {
  /** Execute an action and handle the result */
  executeAndHandle: (action: AgentAction) => Promise<ActionResult>;
  /** Execute a workflow in ComfyUI */
  executeWorkflow: (workflowJson: string) => Promise<string>;
}

export function useAgentActions(handlers: ActionHandler = {}): UseAgentActionsReturn {
  const {
    onUpdateScript,
    onAddToCanvas,
    onShowMessage,
    onGenerationStarted,
  } = handlers;

  const executeAndHandle = useCallback(
    async (action: AgentAction): Promise<ActionResult> => {
      try {
        const result = await invoke<ActionResult>('execute_agent_action', { action });

        if (result.success && result.data) {
          const data = JSON.parse(result.data);

          switch (action.type) {
            case 'UpdateScript':
              onUpdateScript?.(data.content, data.mode, data.line_start, data.line_end);
              break;

            case 'AddToCanvas':
              onAddToCanvas?.(data.node_type, data.content, data.position);
              break;

            case 'ShowMessage':
              onShowMessage?.(data.title, data.content, data.suggestions || []);
              break;

            case 'GenerateImage':
            case 'GenerateVideo':
              if (result.execution_id) {
                onGenerationStarted?.(
                  result.execution_id,
                  action.type === 'GenerateImage' ? 'image' : 'video'
                );
              }
              break;
          }
        }

        return result;
      } catch (err) {
        return {
          success: false,
          action_type: action.type,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    [onUpdateScript, onAddToCanvas, onShowMessage, onGenerationStarted]
  );

  const executeWorkflow = useCallback(async (workflowJson: string): Promise<string> => {
    const result = await invoke<{ prompt_id: string }>('comfyui_execute', {
      workflow: JSON.parse(workflowJson),
    });
    return result.prompt_id;
  }, []);

  return {
    executeAndHandle,
    executeWorkflow,
  };
}

export default useAgentActions;
