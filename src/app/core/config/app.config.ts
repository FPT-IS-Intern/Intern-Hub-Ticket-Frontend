export function getFileBaseUrl(): string {
  const shellEnv = (window as any).__env;

  if (shellEnv && shellEnv.storageFileBaseUrl) {
    return shellEnv.storageFileBaseUrl;
  }

  return '';
}
