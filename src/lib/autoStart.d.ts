export function isBotAgent(ua: string | null | undefined): boolean;
export function shouldAutoStart(search: string, ua: string | null | undefined, isPrerender: boolean): boolean;
export function withoutStartParam(pathname: string, search: string, hash?: string): string;
