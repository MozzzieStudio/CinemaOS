/**
 * Loro P2P WebSocket Transport
 * 
 * Based on research: https://loro.dev/docs
 * 
 * This module provides WebSocket-based transport for Loro CRDT sync.
 * Enables real-time P2P collaboration.
 */

import { LoroDoc } from 'loro-crdt';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface LoroSyncMessage {
  type: 'update' | 'snapshot' | 'sync-request' | 'sync-response' | 'presence';
  documentId: string;
  senderId: string;
  data?: Uint8Array;
  presence?: PresenceData;
}

export interface PresenceData {
  peerId: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  lastSeen: number;
}

export interface LoroTransportConfig {
  url: string;
  documentId: string;
  userId: string;
  userName: string;
  onMessage?: (msg: LoroSyncMessage) => void;
  onConnectionChange?: (connected: boolean) => void;
  onPeersChange?: (peers: PresenceData[]) => void;
  reconnectInterval?: number;
}

type MessageHandler = (msg: LoroSyncMessage) => void;

// ═══════════════════════════════════════════════════════════════════════════════
// LORO WEBSOCKET TRANSPORT
// ═══════════════════════════════════════════════════════════════════════════════

export class LoroWebSocketTransport {
  private ws: WebSocket | null = null;
  private doc: LoroDoc;
  private config: LoroTransportConfig;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private peers: Map<string, PresenceData> = new Map();
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnected = false;

  constructor(doc: LoroDoc, config: LoroTransportConfig) {
    this.doc = doc;
    this.config = {
      reconnectInterval: 3000,
      ...config,
    };
  }

  /**
   * Connect to the sync server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.config.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[Loro Transport] Connected to', this.config.url);
        this.isConnected = true;
        this.config.onConnectionChange?.(true);

        // Request initial sync
        this.send({
          type: 'sync-request',
          documentId: this.config.documentId,
          senderId: this.config.userId,
        });

        // Announce presence
        this.sendPresence();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('[Loro Transport] Disconnected');
        this.isConnected = false;
        this.config.onConnectionChange?.(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Loro Transport] Error:', error);
      };
    } catch (error) {
      console.error('[Loro Transport] Connection failed:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the sync server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Send document update to peers
   */
  sendUpdate(): void {
    const update = this.doc.export({ mode: 'update' });
    this.send({
      type: 'update',
      documentId: this.config.documentId,
      senderId: this.config.userId,
      data: update,
    });
  }

  /**
   * Send full snapshot (for new peers)
   */
  sendSnapshot(): void {
    const snapshot = this.doc.export({ mode: 'snapshot' });
    this.send({
      type: 'snapshot',
      documentId: this.config.documentId,
      senderId: this.config.userId,
      data: snapshot,
    });
  }

  /**
   * Send presence update
   */
  sendPresence(cursor?: { line: number; column: number }): void {
    const presence: PresenceData = {
      peerId: this.config.userId,
      name: this.config.userName,
      color: this.getColorForId(this.config.userId),
      cursor,
      lastSeen: Date.now(),
    };
    
    this.send({
      type: 'presence',
      documentId: this.config.documentId,
      senderId: this.config.userId,
      presence,
    });
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get connected peers
   */
  getPeers(): PresenceData[] {
    return Array.from(this.peers.values());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private send(msg: LoroSyncMessage): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const payload = {
      ...msg,
      data: msg.data ? Array.from(msg.data) : undefined,
    };
    this.ws.send(JSON.stringify(payload));
  }

  private handleMessage(rawData: ArrayBuffer | string): void {
    try {
      const jsonStr = typeof rawData === 'string' 
        ? rawData 
        : new TextDecoder().decode(rawData);
      
      const msg = JSON.parse(jsonStr) as LoroSyncMessage & { data?: number[] };
      
      // Convert data array back to Uint8Array
      if (msg.data && Array.isArray(msg.data)) {
        msg.data = new Uint8Array(msg.data) as any;
      }

      // Handle different message types
      switch (msg.type) {
        case 'update':
          if (msg.data && msg.senderId !== this.config.userId) {
            this.doc.import(msg.data as unknown as Uint8Array);
          }
          break;

        case 'snapshot':
          if (msg.data && msg.senderId !== this.config.userId) {
            this.doc.import(msg.data as unknown as Uint8Array);
          }
          break;

        case 'sync-request':
          // New peer joined, send our snapshot
          this.sendSnapshot();
          break;

        case 'presence':
          if (msg.presence && msg.senderId !== this.config.userId) {
            this.peers.set(msg.senderId, msg.presence);
            this.config.onPeersChange?.(this.getPeers());
          }
          break;
      }

      // Notify handlers
      this.messageHandlers.forEach(handler => handler(msg as LoroSyncMessage));
      this.config.onMessage?.(msg as LoroSyncMessage);

    } catch (error) {
      console.error('[Loro Transport] Failed to parse message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('[Loro Transport] Attempting reconnect...');
      this.connect();
    }, this.config.reconnectInterval);
  }

  private getColorForId(id: string): string {
    const colors = [
      '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6',
      '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
    ];
    return colors[id.charCodeAt(0) % colors.length];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';

export function useLoroWebSocket(
  doc: LoroDoc | null,
  config: Omit<LoroTransportConfig, 'onConnectionChange' | 'onPeersChange'>
) {
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<PresenceData[]>([]);
  const transportRef = useRef<LoroWebSocketTransport | null>(null);

  useEffect(() => {
    if (!doc) return;

    const transport = new LoroWebSocketTransport(doc, {
      ...config,
      onConnectionChange: setIsConnected,
      onPeersChange: setPeers,
    });

    transportRef.current = transport;
    transport.connect();

    return () => {
      transport.disconnect();
      transportRef.current = null;
    };
  }, [doc, config.url, config.documentId, config.userId, config.userName]);

  const sendUpdate = useCallback(() => {
    transportRef.current?.sendUpdate();
  }, []);

  const sendPresence = useCallback((cursor?: { line: number; column: number }) => {
    transportRef.current?.sendPresence(cursor);
  }, []);

  return {
    isConnected,
    peers,
    sendUpdate,
    sendPresence,
  };
}
