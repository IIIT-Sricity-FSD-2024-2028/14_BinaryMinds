import { appendFile, mkdir, readFile, readdir, rename, stat, unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogRecord {
  timestamp: string;
  level: LogLevel;
  requestId?: string;
  [key: string]: unknown;
}

interface LogPayload {
  level: LogLevel;
  requestId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

const MAX_LOG_SIZE_BYTES = 1024 * 1024;
const MAX_ROTATED_LOG_FILES = 5;

/**
 * Best-effort, JSON-lines logger for operational logs. Logging must never
 * change an API response, so all file-system failures are intentionally
 * contained here.
 */
export class LogManager {
  private readonly logDirectory: string;
  private readonly checkedFormat = new Set<string>();

  constructor(logDirectory = resolve(__dirname, '../../../logs')) {
    this.logDirectory = logDirectory;
  }

  write(fileName: 'application.log' | 'error.log', record: LogPayload): Promise<void> {
    return this.append(fileName, {
      ...record,
      timestamp: record.timestamp ?? new Date().toISOString(),
    });
  }

  private async append(fileName: string, record: LogRecord): Promise<void> {
    try {
      await mkdir(this.logDirectory, { recursive: true });
      const logPath = resolve(this.logDirectory, fileName);
      await this.rotateLegacyLogIfNeeded(logPath, fileName);
      await this.rotateIfNeeded(logPath, fileName);
      await appendFile(logPath, `${JSON.stringify(record)}\n`, 'utf8');
    } catch {
      // Logging is best-effort: a full disk or permissions issue must not
      // turn a successful request into a failed request.
    }
  }

  private async rotateLegacyLogIfNeeded(logPath: string, fileName: string): Promise<void> {
    if (this.checkedFormat.has(fileName)) return;
    this.checkedFormat.add(fileName);

    try {
      const contents = await readFile(logPath, 'utf8');
      if (contents.trimStart() && !contents.trimStart().startsWith('{')) {
        await rename(logPath, resolve(this.logDirectory, `${fileName}.${Date.now()}`));
        await this.trimRotatedFiles(fileName);
      }
    } catch {
      // A missing log is expected on first use. appendFile creates it.
    }
  }

  private async rotateIfNeeded(logPath: string, fileName: string): Promise<void> {
    try {
      const details = await stat(logPath);
      if (details.size < MAX_LOG_SIZE_BYTES) return;

      const rotatedName = `${fileName}.${Date.now()}`;
      await rename(logPath, resolve(this.logDirectory, rotatedName));
      await this.trimRotatedFiles(fileName);
    } catch {
      // A missing file or a concurrent rotation is harmless. appendFile will
      // create the active log when possible.
    }
  }

  private async trimRotatedFiles(fileName: string): Promise<void> {
    try {
      const rotatedPrefix = `${fileName}.`;
      const files = (await readdir(this.logDirectory))
        .filter((name) => name.startsWith(rotatedPrefix))
        .sort()
        .reverse();

      await Promise.all(
        files.slice(MAX_ROTATED_LOG_FILES).map((name) =>
          unlink(resolve(this.logDirectory, basename(name))).catch(() => undefined),
        ),
      );
    } catch {
      // Retention failure must not prevent normal logging.
    }
  }
}
