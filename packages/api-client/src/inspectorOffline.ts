export interface OfflineResolveItem {
  taskId: string;
  afterPhotoBase64: string;
  distanceMeters: number;
  capturedAt: number;
  synced: boolean;
}

const INSPECTOR_QUEUE_KEY = "civicpulse_inspector_offline_queue";

export class InspectorOfflineManager {
  getPendingResolves(): OfflineResolveItem[] {
    try {
      const data = localStorage.getItem(INSPECTOR_QUEUE_KEY);
      return data ? (JSON.parse(data) as OfflineResolveItem[]) : [];
    } catch {
      return [];
    }
  }

  enqueueResolve(item: Omit<OfflineResolveItem, "synced" | "capturedAt">): OfflineResolveItem {
    const list = this.getPendingResolves();
    const entry: OfflineResolveItem = {
      ...item,
      capturedAt: Date.now(),
      synced: false
    };
    list.push(entry);
    localStorage.setItem(INSPECTOR_QUEUE_KEY, JSON.stringify(list));
    return entry;
  }

  clearSynced(taskId: string): void {
    const list = this.getPendingResolves().filter((i) => i.taskId !== taskId);
    localStorage.setItem(INSPECTOR_QUEUE_KEY, JSON.stringify(list));
  }
}

export const inspectorOfflineManager = new InspectorOfflineManager();
