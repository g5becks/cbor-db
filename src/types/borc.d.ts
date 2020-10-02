declare module 'borc' {
    import { CodecEncoder } from 'level-codec'

    export function decode(input: Buffer | string, enc?: string): unknown
    export function decodeAll(input: Buffer | string, enc?: string): Array<unknown>

    export function encode(o: any): Buffer
    export const leveldb: CodecEncoder
}
