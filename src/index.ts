/**
 * @packageDocumentation Cbor-DB - An embedded database for [typescript](https://www.typescriptlang.org/) and [nodejs](https://nodejs.org/en/). Built as a tiny wrapper around [level](https://www.npmjs.com/package/level) using [borc](https://www.npmjs.com/package/borc) for encoding.
 */
import { AbstractIteratorOptions, ErrorCallback } from 'abstract-leveldown'
import BigNumber from 'bignumber.js'
import { leveldb } from 'borc'
import * as fs from 'fs'
import level from 'level'
import levelMem from 'level-mem'
import { LevelUp } from 'levelup'
import sub from 'subleveldown'
type EncodeableScalar = boolean | number | string | undefined | Buffer | Date | RegExp | URL | BigNumber | null

type Obj = Record<string, EncodeableScalar | EncodeableContainer>
type EncodeableContainer =
    | Set<EncodeableScalar | EncodeableContainer | Obj>
    | Map<
          Omit<EncodeableScalar, 'undefined' | 'null'> | EncodeableContainer | Obj,
          EncodeableScalar | EncodeableContainer | Obj
      >
    | Array<EncodeableScalar | EncodeableContainer | Obj>

/**
 * Valid types that can be stored/encoded.
 * see [borc supported types](https://github.com/dignifiedquire/borc#supported-types)
 */
export type Encodeable = EncodeableScalar | EncodeableContainer | Obj

/**
 * An type that will be stored inside the DB must have
 * this shape. The id field is used as the key, all other fields
 * must be {@link Encodeable}
 */
export type Storable = {
    readonly id: string | number
} & Encodeable

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null

/**
 * Handles all interactions with the level instance.
 * Each DB instance stores objects of type T
 * @typeParam T any type of shape {@link Storable}
 */
export class DB<T extends Storable> {
    protected readonly db: LevelUp
    private constructor(location: string | ':mem:', subDb?: { db: LevelUp; prefix: string }) {
        if (subDb) {
            this.db = sub(subDb.db, subDb.prefix, {
                keyEncoding: leveldb,
                valueEncoding: leveldb,
            })
            return
        }
        if (location === ':mem:') {
            this.db = levelMem({
                keyEncoding: leveldb,
                valueEncoding: leveldb,
            })
            return
        }
        this.db = level(location, {
            keyEncoding: leveldb,
            valueEncoding: leveldb,
        })
    }

    /**  Factory method for creating a new {@link DB<T>} instance.
     *  When running in node - this method will attempt to check if
     *  the provided location exists and try to create it if it doesn't.
     *
     * @typeParam T any type of shape {@link Storable}
     *
     *  @param location the directory to store database data.
     *  Pass the string ':mem:' to create an instance that uses
     *  [memdown](https://www.npmjs.com/package/memdown) instead.
     *
     *  ```typescript
           type User = {
             id: string
             username: string
           }
     *     const userDB = DB.create<User>('/some/path/to/store/in')
     *  ```
     */
    static create<T extends Storable>(location: string | ':mem:'): DB<T> {
        if (location === ':mem:') {
            return new DB<T>(location)
        }
        if (isNode) {
            try {
                if (!fs.existsSync(location)) {
                    fs.mkdirSync(location)
                }
            } catch (error) {
                console.log(`error occurred creating directory at ${location}, ${error}`)
            }
        }
        return new DB<T>(location)
    }

    /**
     * Creates a sub DB instance using {@link https://www.npmjs.com/package/subleveldown}
     *
     * @param prefix prefix of sub database
     */
    createSub<T extends Storable>(prefix: string): DB<T> {
        return new DB<T>('', { db: this.db, prefix })
    }

    private async all(where?: (item: T) => boolean, limit?: number): Promise<T[]> {
        const stream = this.db.createValueStream()
        let result: T[] = []
        return new Promise<T[]>((resolve, reject) => {
            stream
                .on('data', function (data: T[]) {
                    const [parsed] = data
                    if (!!limit && result.length < limit !== true) return
                    if (!!where && !where(parsed)) {
                        return
                    }
                    result = result.concat(parsed)
                })
                .on('error', reject)
                .on('end', () => resolve(result))
        })
    }
    /**
     *  Executes queries on the database.
     * @param query An object with query options
     * @returns Promise<T[]>
     */
    async find(query?: {
        where?: (item: T) => boolean
        sort?: (item1: T, item2: T) => number
        limit?: number
    }): Promise<T[]> {
        if (query) {
            const items = await this.all(query.where, query.limit)
            if (query.sort) return items.sort(query.sort)
            return items
        }

        return this.all()
    }
    /**
     * Returns the number of items stored in the database
     */
    async count(): Promise<number> {
        let count = 0
        return new Promise<number>((resolve, reject) => {
            this.db
                .createKeyStream()
                .on('data', () => count++)
                .on('error', reject)
                .on('end', () => resolve(count))
        })
    }

    forEach(cb: (item: T, stop: () => void) => void): void {
        let stopped = false
        const stopper = () => (stopped = true)
        this.db.createValueStream().on('data', function (data: T) {
            if (!stopped) cb(data, stopper)
        })
    }
    /**
     * Stores or updates items in the DB
     *
     * @param value item to store or update
     */
    async put(value: T): Promise<void> {
        return this.db.put(value.id, value)
    }

    /**
     * Adds or updates an Array of items in the database.
     *
     * @param values items to store or update.
     */
    async putMany(values: T[]): Promise<void> {
        return this.db.batch(values.map((val) => ({ type: 'put', key: val.id, value: val })))
    }

    /**
     * Retrieves an item from the database.
     *
     * @param key key of the item to retrieve
     */
    async get(key: string | number): Promise<T> {
        const [data] = await this.db.get(key)
        return data
    }

    /**
     * Deletes an item from the database
     *
     * @param key key of the item to delete
     */
    async del(key: string | number): Promise<void> {
        return this.db.del(key)
    }

    /**
     * Deletes an Array of items from the database.
     *
     * @param keys keys of the items to delete.
     */
    async delMany(keys: (string | number)[]): Promise<void> {
        return this.db.batch(keys.map((key) => ({ type: 'del', key })))
    }

    /**
     * Closes the database.
     *
     * @param callback function to call in case of errors.
     */
    async close(callback?: ErrorCallback): Promise<void> {
        this.db.close(callback)
    }

    /**
     * Checks to see if the database is open.
     */
    isOpen(): boolean {
        return this.db.isOpen()
    }

    /**
     * Checks to see if the database is closed.
     */
    isClosed(): boolean {
        return this.db.isClosed()
    }

    /*
    emitted on given event
    */
    on(event: 'open' | 'ready' | 'closed' | 'opening' | 'closing', cb: () => void): this {
        this.db.on(event, cb)
        return this
    }
    createReadStream(options?: AbstractIteratorOptions): NodeJS.ReadableStream {
        return this.db.createReadStream(options)
    }
}
