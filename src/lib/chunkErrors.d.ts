import type { ComponentType } from 'react';
export function isChunkLoadError(err: unknown): boolean;
export const RELOAD_KEY: string;
export function reloadOnce(storage: Pick<Storage, 'getItem' | 'setItem'>, reload: () => void, now?: number): boolean;
export function safeImport<T extends { default: ComponentType<any> }>(factory: () => Promise<T>): Promise<T | { default: ComponentType<any> }>;
