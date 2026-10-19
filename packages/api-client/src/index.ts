if (typeof Promise.withResolvers === "undefined") {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export * from "./types";
export * from "./mockData";
export * from "./client";
export * from "./auth";
export * from "./nonce";
export * from "./offlineQueue";
export * from "./timeline";
export * from "./sla";
export * from "./inspectorOffline";
export * from "./geospatialData";
export * from "./accountabilityData";
export * from "./privacy";
export * from "./analyticsData";
