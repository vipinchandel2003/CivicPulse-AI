export interface CaptureNonceState {
  nonce: string;
  expiresAt: number; // Unix ms
  ttlSeconds: number;
}

export class NonceManager {
  private currentNonce: CaptureNonceState | null = null;

  setNonce(nonce: string, expiresAtIso: string): CaptureNonceState {
    const expiresAt = new Date(expiresAtIso).getTime();
    const ttlSeconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
    this.currentNonce = {
      nonce,
      expiresAt,
      ttlSeconds
    };
    return this.currentNonce;
  }

  getFreshNonce(): string | null {
    if (!this.currentNonce) return null;
    const remaining = this.currentNonce.expiresAt - Date.now();
    // Invalidate if less than 2 seconds remaining
    if (remaining <= 2000) {
      this.currentNonce = null;
      return null;
    }
    return this.currentNonce.nonce;
  }

  getRemainingSeconds(): number {
    if (!this.currentNonce) return 0;
    return Math.max(0, Math.round((this.currentNonce.expiresAt - Date.now()) / 1000));
  }
}

export const nonceManager = new NonceManager();
