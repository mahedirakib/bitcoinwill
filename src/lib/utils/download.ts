/**
 * Utility to download data as a JSON file in the browser.
 */
const triggerDownload = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
};

export const downloadJson = <T>(filename: string, data: T) => {
  let jsonString: string;
  try {
    jsonString = JSON.stringify(data, null, 2);
  } catch {
    throw new Error('Failed to serialize data to JSON');
  }
  triggerDownload(filename, new Blob([jsonString], { type: 'application/json' }));
};

export const downloadTxt = (filename: string, content: string) => {
  triggerDownload(filename, new Blob([content], { type: 'text/plain' }));
};
