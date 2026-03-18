export const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : 'Not set');

export const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : 'Not set');

export const formatFileSize = (bytes: number) => {
    let size = bytes;
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    while (size > 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
};
