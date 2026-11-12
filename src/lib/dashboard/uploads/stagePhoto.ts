const DB_NAME = "jj-photo-staging";
const STORE_NAME = "photos";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function stagePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Please select a JPEG or PNG photograph.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Photograph exceeds 10 MB.");
  }

  const id = crypto.randomUUID();
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }

  return `jj-staged:${id}`;
}

export async function getStagedPhoto(id: string): Promise<File | undefined> {
  const db = await openDatabase();

  try {
    return await new Promise<File | undefined>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as File | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function getStagedPhotoPreview(
  stagedSource: string
): Promise<string> {
  if (!stagedSource.startsWith("jj-staged:")) {
    return stagedSource;
  }

  const id = stagedSource.slice("jj-staged:".length);
  const file = await getStagedPhoto(id);

  if (!file) {
    throw new Error("The staged photograph could not be found.");
  }

  return URL.createObjectURL(file);
}
