import { db } from './db';

type SerializedBlob = { __blob: true; type: string; base64: string };

type ExportedRow = Record<string, unknown>;

export type ForgeExport = {
  app: 'forge';
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, ExportedRow[]>;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const url = String(reader.result); // data:<type>;base64,<data>
      resolve(url.slice(url.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function serializeRow(row: ExportedRow): Promise<ExportedRow> {
  const out: ExportedRow = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] =
      value instanceof Blob
        ? ({ __blob: true, type: value.type, base64: await blobToBase64(value) } satisfies SerializedBlob)
        : value;
  }
  return out;
}

function isSerializedBlob(value: unknown): value is SerializedBlob {
  return typeof value === 'object' && value !== null && (value as SerializedBlob).__blob === true;
}

function deserializeRow(row: ExportedRow): ExportedRow {
  const out: ExportedRow = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = isSerializedBlob(value) ? base64ToBlob(value.base64, value.type) : value;
  }
  return out;
}

/** Full JSON-safe dump of every table (photos' blobs as base64). */
export async function exportAll(): Promise<ForgeExport> {
  const tables: Record<string, ExportedRow[]> = {};
  for (const table of db.tables) {
    const rows = (await table.toArray()) as ExportedRow[];
    tables[table.name] = await Promise.all(rows.map(serializeRow));
  }
  return {
    app: 'forge',
    schemaVersion: db.verno,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** Replace the entire database contents with a previously exported dump. */
export async function importAll(dump: ForgeExport): Promise<void> {
  if (dump.app !== 'forge' || typeof dump.tables !== 'object') {
    throw new Error('Not a Forge export file');
  }
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      const rows = dump.tables[table.name];
      if (rows?.length) {
        await table.bulkAdd(rows.map(deserializeRow) as never[]);
      }
    }
  });
}
