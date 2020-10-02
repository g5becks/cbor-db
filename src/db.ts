const level = require('level')

export type Saveable = {
    id: string | number
}
export class DB<T> {
    private readonly db: any

    constructor(
        location: string,
        encoding?: {
            encoder: (data: T) => Buffer
            decoder: (data: Buffer) => T
        },
    ) {
        let valueEncoding

        if (encoding) {
            valueEncoding = { buffer: true, type: 'CustomDepotEncoding', ...encoding }
        } else {
            valueEncoding = 'json'
        }

        this.db = level(location, { keyEncoding: 'utf8', valueEncoding })
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

    async find(query?: { where?: (item: T) => boolean; sort?: (item1: T, item2: T) => number; limit?: number }) {
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

    async put(key: string, value: T): Promise<void> {
        return this.db.put(key, value)
    }

    async get(key: string): Promise<T> {
        return this.db.get(key)
    }

    async del(key: string): Promise<void> {
        return this.db.del(key)
    }

    createReadStream(options?: any) {
        return this.db.createReadStream(options)
    }
}
