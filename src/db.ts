import { AbstractIteratorOptions } from 'abstract-leveldown'
import BigNumber from 'bignumber.js'
import { leveldb } from 'borc'
import * as fs from 'fs'
import level from 'level'
import { LevelUp } from 'levelup'
export type EncodeableScalar = boolean | number | string | undefined | Buffer | Date | RegExp | URL | BigNumber | null
export type EncodeableContainer =
    | Set<EncodeableScalar | EncodeableContainer>
    | Map<Omit<EncodeableScalar, 'undefined' | 'null'>, EncodeableScalar | EncodeableContainer>
    | Array<EncodeableScalar | EncodeableContainer>

type Encodeable = EncodeableScalar | EncodeableContainer | Record<string, EncodeableScalar | EncodeableContainer>
export type Saveable = {
    id: string | number
} & Encodeable

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null

export class DB<T extends Saveable> {
    private readonly db: LevelUp

    private constructor(location: string) {
        this.db = level(location, {
            keyEncoding: leveldb,
            valueEncoding: leveldb,
        })
    }

    /**  Creatss a new DB<T>, when running in node - this function check if
     *  the provided location exists and try to create it if it doesn't
     */
    static create<T extends Saveable>(location: string): DB<T> {
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

    private async all(where?: (item: T) => boolean, limit?: number): Promise<T[]> {
        const stream = this.db.createValueStream()
        const result: T[] = []
        return new Promise<T[]>((resolve, reject) => {
            stream
                .on('data', function (data: T) {
                    if (!!limit && !(result.length < limit)) return
                    if (!!where && !where(data)) return
                    result.push(data)
                })
                .on('error', reject)
                .on('end', () => resolve(result))
        })
    }

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

    async count(): Promise<number> {
        let count = 0
        return new Promise<number>((resolve, reject) => {
            this.db
                .createKeyStream()
                .on('data', () => (count += 1))
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

    async put(value: T): Promise<void> {
        return this.db.put(value.id, value)
    }

    async get(key: string | number): Promise<T> {
        return this.db.get(key)
    }

    async del(key: string | number): Promise<void> {
        return this.db.del(key)
    }

    createReadStream(options?: AbstractIteratorOptions): NodeJS.ReadableStream {
        return this.db.createReadStream(options)
    }
}
