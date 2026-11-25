import { businessConfig } from "../config/businessConfig.js";

/** Maps a partner name from the API to the name used in our CSV. */
export function normalizePartnerName(name: string): string {
    return businessConfig.partnerAliases[name] ?? name;
}
