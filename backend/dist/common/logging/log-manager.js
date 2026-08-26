"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogManager = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const MAX_LOG_SIZE_BYTES = 1024 * 1024;
const MAX_ROTATED_LOG_FILES = 5;
class LogManager {
    logDirectory;
    checkedFormat = new Set();
    constructor(logDirectory = (0, node_path_1.resolve)(__dirname, '../../../logs')) {
        this.logDirectory = logDirectory;
    }
    write(fileName, record) {
        return this.append(fileName, {
            ...record,
            timestamp: record.timestamp ?? new Date().toISOString(),
        });
    }
    async append(fileName, record) {
        try {
            await (0, promises_1.mkdir)(this.logDirectory, { recursive: true });
            const logPath = (0, node_path_1.resolve)(this.logDirectory, fileName);
            await this.rotateLegacyLogIfNeeded(logPath, fileName);
            await this.rotateIfNeeded(logPath, fileName);
            await (0, promises_1.appendFile)(logPath, `${JSON.stringify(record)}\n`, 'utf8');
        }
        catch {
        }
    }
    async rotateLegacyLogIfNeeded(logPath, fileName) {
        if (this.checkedFormat.has(fileName))
            return;
        this.checkedFormat.add(fileName);
        try {
            const contents = await (0, promises_1.readFile)(logPath, 'utf8');
            if (contents.trimStart() && !contents.trimStart().startsWith('{')) {
                await (0, promises_1.rename)(logPath, (0, node_path_1.resolve)(this.logDirectory, `${fileName}.${Date.now()}`));
                await this.trimRotatedFiles(fileName);
            }
        }
        catch {
        }
    }
    async rotateIfNeeded(logPath, fileName) {
        try {
            const details = await (0, promises_1.stat)(logPath);
            if (details.size < MAX_LOG_SIZE_BYTES)
                return;
            const rotatedName = `${fileName}.${Date.now()}`;
            await (0, promises_1.rename)(logPath, (0, node_path_1.resolve)(this.logDirectory, rotatedName));
            await this.trimRotatedFiles(fileName);
        }
        catch {
        }
    }
    async trimRotatedFiles(fileName) {
        try {
            const rotatedPrefix = `${fileName}.`;
            const files = (await (0, promises_1.readdir)(this.logDirectory))
                .filter((name) => name.startsWith(rotatedPrefix))
                .sort()
                .reverse();
            await Promise.all(files.slice(MAX_ROTATED_LOG_FILES).map((name) => (0, promises_1.unlink)((0, node_path_1.resolve)(this.logDirectory, (0, node_path_1.basename)(name))).catch(() => undefined)));
        }
        catch {
        }
    }
}
exports.LogManager = LogManager;
//# sourceMappingURL=log-manager.js.map