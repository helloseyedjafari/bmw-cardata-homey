/**
 * TEMPORARY type augmentation - delete after merging the lib/streaming change.
 *
 * `MqttStreamClient.onStateChange` is being added to lib/streaming/MqttStreamClient.ts by a
 * parallel change. This declaration only exists so `tsc` passes in this isolated worktree;
 * the integrator removes this file once the real implementation is merged.
 */
import type { ConnectionState } from '../lib/streaming/IMqttClient';

declare module '../lib/streaming/MqttStreamClient' {
  interface MqttStreamClient {
    /**
     * Register a handler that is called on every connection state change.
     *
     * @param handler - Callback receiving the new connection state
     */
    onStateChange(handler: (state: ConnectionState) => void): void;
  }
}
