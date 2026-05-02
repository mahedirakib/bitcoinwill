/**
 * Utility to download data as a JSON file in the browser.
 */
export const downloadJson = <T>(filename: string, data: T) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Delay cleanup so the browser has time to start the download
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

export const downloadTxt = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Delay cleanup so the browser has time to start the download
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};
