export const stamp = (): Date => {
    return new Date(Date.now());
};

export const stampString = (): string => {
    const stamp = (new Date(Date.now()).toISOString()).replace('T', ' ').substring(0, 19);
    return stamp;
};