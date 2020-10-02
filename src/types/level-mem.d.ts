declare module 'level-mem' {
    import { CodecOptions } from 'level-codec'
    import { LevelUp } from 'levelup'
    export default function (options?: CodecOptions & Record<string, unknown>): LevelUp
}
