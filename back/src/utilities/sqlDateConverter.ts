export const sqlDateConverter = (stamp: null | string): string | null => {

    if(!stamp) {
        return stamp;
    }

    return `CAST('${new Date(stamp).toISOString().replace('T', ' ').slice(0, 19)}' AS DATETIME)`;
}