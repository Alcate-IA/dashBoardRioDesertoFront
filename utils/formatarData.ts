export function formatarData(date: Date): string {
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${mes}/${ano}`;
}
