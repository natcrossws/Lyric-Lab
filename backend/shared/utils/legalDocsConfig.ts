import path from 'path';
import fs from 'fs';

const CONFIG_PATH = path.join(__dirname, '../../config/legalDocs.json');

export type LegalDocTipo = 'AVISO_PRIVACIDAD' | 'TERMINOS_CONDICIONES';

export interface LegalDocEntry {
  version: string;
  r2_key: string | null;
  mime?: string;
  nombre_archivo?: string | null;
  updated_at?: string | null;
  texto_preview?: string | null;
}

export type LegalDocsConfig = Record<LegalDocTipo, LegalDocEntry>;

const DEFAULTS: LegalDocsConfig = {
  AVISO_PRIVACIDAD: { version: '1.0', r2_key: null },
  TERMINOS_CONDICIONES: { version: '1.0', r2_key: null }
};

export function readLegalConfig(): LegalDocsConfig {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as Partial<LegalDocsConfig>;
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeLegalConfig(cfg: LegalDocsConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

export function getCurrentVersions(): Record<LegalDocTipo, string> {
  const cfg = readLegalConfig();
  return {
    AVISO_PRIVACIDAD: cfg.AVISO_PRIVACIDAD?.version || '1.0',
    TERMINOS_CONDICIONES: cfg.TERMINOS_CONDICIONES?.version || '1.0'
  };
}
