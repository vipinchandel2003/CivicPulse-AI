import { CreateIssuePayload } from "./types";

export interface QueuedSubmission {
  id: string;
  createdAt: number;
  payload: CreateIssuePayload;
  retryCount: number;
  lastError?: string;
}

const OFFLINE_QUEUE_KEY = "civicpulse_offline_queue";

export class OfflineQueueManager {
  getQueue(): QueuedSubmission[] {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? (JSON.parse(data) as QueuedSubmission[]) : [];
    } catch {
      return [];
    }
  }

  enqueue(payload: CreateIssuePayload): QueuedSubmission {
    const queue = this.getQueue();
    const item: QueuedSubmission = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      payload,
      retryCount: 0
    };
    queue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return item;
  }

  dequeue(id: string): void {
    const queue = this.getQueue().filter((item) => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  markFailed(id: string, error: string): void {
    const queue = this.getQueue().map((item) =>
      item.id === id
        ? { ...item, retryCount: item.retryCount + 1, lastError: error }
        : item
    );
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }
}

export const offlineQueue = new OfflineQueueManager();
