export const isolationRule: {
  purpose: string;
  resource_project_id: string;
  selection_rule: string;
};

export const CORE_KINDS: ReadonlySet<string>;

export function isIsolatedResource(resource: { project_id?: string } | null | undefined): boolean;
export function isIsolatedProject(project: { id?: string } | null | undefined): boolean;
export function publicResources<T extends { project_id?: string }>(resources: readonly T[]): T[];
export function publicProjects<T extends { id?: string }>(projects: readonly T[], resources: readonly { project_id?: string }[]): T[];
export function publicCategoryCounts(resources: readonly { project_id?: string; kind?: string }[]): {
  core: number;
  filmAndScene: number;
  maps: number;
  shots: number;
  styles: number;
};
export function isolatedPosterBasenames(resources: readonly { id?: string; project_id?: string; preview?: { poster?: string } }[]): string[];
export function filterCatalogModule(filename: string, code: string): string | null;
