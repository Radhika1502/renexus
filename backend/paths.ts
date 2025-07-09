/**
 * Path aliases for the reorganized project structure
 * This file helps resolve imports after the directory reorganization
 */

import path from 'path';

const ROOT_PATH = path.resolve(__dirname, '..');
const SRC_PATH = path.join(ROOT_PATH, 'src');
const PACKAGES_PATH = path.join(ROOT_PATH, 'packages');
const SERVICES_PATH = path.join(ROOT_PATH, 'services');
const TYPES_PATH = path.join(ROOT_PATH, 'types');
const UTILS_PATH = path.join(ROOT_PATH, 'utils');

export const resolvePath = (base: string, ...args: string[]) => path.resolve(base, ...args);

export const resolveSrcPath = (p: string) => resolvePath(SRC_PATH, p);
export const resolvePackagesPath = (p: string) => resolvePath(PACKAGES_PATH, p);
export const resolveServicesPath = (p: string) => resolvePath(SERVICES_PATH, p);
export const resolveTypesPath = (p: string) => resolvePath(TYPES_PATH, p);
export const resolveUtilsPath = (p: string) => resolvePath(UTILS_PATH, p);

function getRootPath() {
  // Simple utility to get root path, can be expanded later
  return '/';
}
