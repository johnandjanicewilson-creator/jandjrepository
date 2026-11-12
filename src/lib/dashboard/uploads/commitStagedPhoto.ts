import { getStagedPhoto } from "./stagePhoto";
import { uploadPhoto } from "./uploadPhoto";

const STAGED_PREFIX = "jj-staged:";

export async function commitStagedPhoto(source: string): Promise<string> {
  if (!source.startsWith(STAGED_PREFIX)) {
    return source;
  }

  const id = source.slice(STAGED_PREFIX.length);

  if (!id) {
    throw new Error("Invalid staged photograph reference.");
  }

  const file = await getStagedPhoto(id);

  if (!file) {
    throw new Error(
      "A photograph is missing from browser storage. Please select it again before saving."
    );
  }

  return uploadPhoto(file);
}
