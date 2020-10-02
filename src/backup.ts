import { Depot } from "./depot";
import fs = require("fs");
import split = require("split");
import zlib = require("zlib");
import through = require("through");

/**
 * Backup the db to a gzip file
 * @param location - Location to write backup to (Should end in .gz)
 */
function backup(db: Depot<any>, location: fs.PathLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        createBackupStream(db)
            .pipe(fs.createWriteStream(location))
            .once("close", resolve)
            .once("error", reject);
    })
}

/**
 * Load the db from a backup.gz
 * @param location Location of the backup gz
 */
function loadBackup(db: Depot<any>, location: fs.PathLike): Promise<void> {
    return loadFromBackupStream(db, fs.createReadStream(location, "utf8"));
}

/**
 * Load the gziped backup from a stream
 */
function loadFromBackupStream(db: Depot<any>, source: NodeJS.ReadableStream): Promise<void> {
    let dbChain = Promise.resolve();
    source
        .pipe(zlib.createGunzip())
        .pipe(split())
        .pipe(through((str: string) => {
            const data = JSON.parse(str);
            dbChain = dbChain.then(() => db.put(data.key, data.value));
        }))
    return dbChain;
}

/** Returns a gzip backup stream */
function createBackupStream(db: Depot<any>): NodeJS.ReadableStream {
    return db.createReadStream()
        .pipe(through(function(this: any, data: any) {
            this.queue(JSON.stringify(data) + "\n");
        }))
        .pipe(zlib.createGzip());
}

export const utils = { backup, loadBackup, loadFromBackupStream, createBackupStream };