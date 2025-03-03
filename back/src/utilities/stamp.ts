const advanced = 1000 * 60 * 60 * 8;
export const stamp = (): Date => new Date(Date.now() + advanced);
export const stampString = (): string => (new Date(Date.now() + advanced).toISOString()).replace('T', ' ').substring(0, 19);