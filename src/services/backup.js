import localforage from 'localforage';

const BACKUP_STORE = 'backup_settings';
const BACKUP_FILE_NAME = 'backup-auto.json';
const DEFAULT_THRESHOLD = 10;

let dirHandle = null;
let counter = 0;
let threshold = DEFAULT_THRESHOLD;

async function init() {
  const meta = await localforage.getItem(BACKUP_STORE);
  if (meta && meta.threshold) threshold = meta.threshold;
  if (meta && meta.dirHandle) {
    try {
      dirHandle = meta.dirHandle;
    } catch (e) {
      console.warn('Failed to load stored dirHandle', e);
      dirHandle = null;
    }
  }
}

async function saveMeta() {
  await localforage.setItem(BACKUP_STORE, { threshold, dirHandle });
}

export async function chooseDirectory() {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Directory picker not supported in this browser');
  }
  try {
    dirHandle = await window.showDirectoryPicker();
    await saveMeta();
    return dirHandle;
  } catch (e) {
    console.warn('directory pick canceled', e);
    throw e;
  }
}

export async function saveBackupJSON(jsonString, filename = BACKUP_FILE_NAME) {
  if (dirHandle) {
    try {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return true;
    } catch (e) {
      console.warn('Failed writing file to directory', e);
      // fallback to download trigger
    }
  }
  // fallback to anchor download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

export async function readBackupJSON(filename = BACKUP_FILE_NAME) {
  if (dirHandle) {
    try {
      const fileHandle = await dirHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return { text, lastModified: file.lastModified };
    } catch (e) {
      console.warn('No backup file to read or read failed', e);
      return null;
    }
  }
  return null;
}

export async function setAutoImport(enabled) {
  const meta = (await localforage.getItem(BACKUP_STORE)) || {};
  meta.autoImport = !!enabled;
  await localforage.setItem(BACKUP_STORE, meta);
}

export async function getAutoImport() {
  const meta = (await localforage.getItem(BACKUP_STORE)) || {};
  return !!meta.autoImport;
}

export async function checkAndAutoImport(dbInstance) {
  // check if auto import enabled and if the backup file is newer than lastImported
  const meta = (await localforage.getItem(BACKUP_STORE)) || {};
  if (!meta || !meta.autoImport) return { imported: false };
  if (!dirHandle) return { imported: false };
  try {
    const fh = await dirHandle.getFileHandle(BACKUP_FILE_NAME);
    const f = await fh.getFile();
    const last = f.lastModified;
    const lastImported = meta.lastImported || 0;
    if (last > lastImported) {
      const text = await f.text();
      const ok = await dbInstance.importData(text);
      if (ok) {
        meta.lastImported = last;
        await localforage.setItem(BACKUP_STORE, meta);
        return { imported: true };
      }
    }
  } catch (e) {
    console.warn('Auto import failed', e);
    return { imported: false };
  }
  return { imported: false };
}

export async function clearDirectory() {
  dirHandle = null;
  await saveMeta();
}

export function getThreshold() { return threshold; }
export async function setThreshold(n) { threshold = Math.max(1, Math.floor(n || DEFAULT_THRESHOLD)); await saveMeta(); }

export async function registerExamChange() {
  counter++;
  await localforage.setItem('backup_counter', counter);
  if (counter >= threshold) {
    // request a save; we let db call saveBackup externally to get current JSON
    // caller should call `performAutoExport` to actually write the backup.
    return true; // indicates that threshold reached
  }
  return false;
}

export async function resetCounter() { counter = 0; await localforage.setItem('backup_counter', 0); }

export async function performAutoExport(getJsonCallback) {
  try {
    const json = await getJsonCallback();
    await saveBackupJSON(json, BACKUP_FILE_NAME);
    await resetCounter();
    return true;
  } catch (e) {
    console.error('Auto export failed', e);
    return false;
  }
}
export function getDirHandle() { return dirHandle; }
export function getBackupDirName() { return dirHandle ? (dirHandle.name || null) : null; }

export default {
  init,
  chooseDirectory,
  saveBackupJSON,
  readBackupJSON,
  getThreshold,
  setThreshold,
  registerExamChange,
  resetCounter,
  performAutoExport,
  getDirHandle,
  getBackupDirName,
  clearDirectory,
  setAutoImport,
  getAutoImport,
  checkAndAutoImport
};
