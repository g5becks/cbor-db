declare module 'level' {
    import { CodecOptions } from 'level-codec'
    import { LevelUp } from 'levelup'

    export default function (location: string, options?: CodecOptions & Record<string, unknown>): LevelUp
}
