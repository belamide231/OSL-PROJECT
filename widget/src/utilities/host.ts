import { dns } from "../environment/dns";

export function host(path: string): string {
    return `${dns.slice(0, -1)}${path}`;
}
