// The parts of Node's built-in SQLite used by d1.test.ts (the installed @types/node predates it).
declare module "node:sqlite" {
    interface StatementSync {
        get(...values: unknown[]): unknown;
        all(...values: unknown[]): unknown[];
        run(...values: unknown[]): unknown;
    }
    export class DatabaseSync {
        constructor(path: string);
        prepare(sql: string): StatementSync;
    }
}
