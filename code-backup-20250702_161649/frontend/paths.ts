/**
 * Path aliases for the reorganized project structure
 * This file helps resolve imports after the directory reorganization
 */

// For TypeScript/JavaScript modules
export const SHARED_PATH = '../../shared';
export const CONFIG_PATH = '../../shared/config';
export const TYPES_PATH = '../../shared/types';
export const UTILS_PATH = '../../shared/utils';

// Helper function to resolve paths
export function resolvePath(basePath, relativePath) {
  return \/\;
}

// Export path resolvers
export const resolveSharedPath = (path) => resolvePath(SHARED_PATH, path);
export const resolveConfigPath = (path) => resolvePath(CONFIG_PATH, path);
export const resolveTypesPath = (path) => resolvePath(TYPES_PATH, path);
export const resolveUtilsPath = (path) => resolvePath(UTILS_PATH, path);
