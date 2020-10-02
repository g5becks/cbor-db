import { decodeAll, encode } from 'borc'
import * as fs from 'fs'
import { Transform } from 'readable-stream'
import split from 'split2'
import zlib from 'zlib'
import { DB, Storable } from './db'

/**
 * Backup the db to a gzip file
 * @param location - Location to write backup to (Should end in .gz)
 */
function backup(db: DB<Storable>, location: fs.PathLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        createBackupStream(db).pipe(fs.createWriteStream(location)).once('close', resolve).once('error', reject)
    })
}

/**
 * Load the db from a backup.gz
 * @param location Location of the backup gz
 */
function loadBackup(db: DB<Storable>, location: fs.PathLike): Promise<void> {
    return loadFromBackupStream(db, fs.createReadStream(location, 'utf8'))
}

const dec = (db: DB<Storable>, dbChain: Promise<void>) =>
    new Transform({
        transform(chunk) {
            const [data] = decodeAll(chunk) as Storable[]
            dbChain = dbChain.then(() => db.put(data))
        },
    })

/**
 * Load the gziped backup from a stream
 */
function loadFromBackupStream(db: DB<Storable>, source: NodeJS.ReadableStream): Promise<void> {
    const dbChain = Promise.resolve()
    source.pipe(zlib.createGunzip()).pipe(split()).pipe(dec(db, dbChain))
    return dbChain
}

const enc = new Transform({
    transform(chunk) {
        encode(chunk)
    },
})
/** Returns a gzip backup stream */
function createBackupStream(db: DB<Storable>): NodeJS.ReadableStream {
    return db.createReadStream().pipe(enc).pipe(zlib.createGzip())
}

export const utils = { backup, loadBackup, loadFromBackupStream, createBackupStream }
