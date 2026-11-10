export function stripIsolatedPosters(distDir: string, basenames: readonly string[]): Promise<{ removed: number; missing: string[] }>;

export function assertPublicDist(distDir: string, spec: {
  resourceIds: readonly string[];
  projectId: string;
  posterBasenames: readonly string[];
}): Promise<void>;
