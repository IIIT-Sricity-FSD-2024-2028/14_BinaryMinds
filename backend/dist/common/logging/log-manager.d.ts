export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
interface LogPayload {
    level: LogLevel;
    requestId?: string;
    timestamp?: string;
    [key: string]: unknown;
}
export declare class LogManager {
    private readonly logDirectory;
    private readonly checkedFormat;
    constructor(logDirectory?: string);
    write(fileName: 'application.log' | 'error.log', record: LogPayload): Promise<void>;
    private append;
    private rotateLegacyLogIfNeeded;
    private rotateIfNeeded;
    private trimRotatedFiles;
}
export {};
