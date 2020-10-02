import { DB } from '../src'
type Person = { id: number; firstname: string; lastname: string; age: number; address: string }

const people: Person[] = [
    { id: 1, firstname: 'gary', lastname: 'becks', address: '', age: 32 },
    { id: 2, firstname: 'tony', lastname: 'everson', address: '', age: 32 },
    { id: 3, firstname: 'larry', lastname: 'gibbs', address: '', age: 32 },
    { id: 4, firstname: 'harvey', lastname: 'sanders', address: '', age: 32 },
    { id: 5, firstname: 'lisa', lastname: 'simms', address: '', age: 32 },
    { id: 6, firstname: 'amy', lastname: 'witherspoon', address: '', age: 32 },
]
let testDB: DB<Person>

beforeEach(async () => {
    testDB = DB.create<Person>(':mem:')
    await testDB.putMany(people)
})

describe('DB', () => {
    test('returns the correct person object', async () => {
        people.forEach(async (p, i) => {
            const res = await testDB.get(p.id)
            expect(res).toEqual(people[i])
        })
    })

    test('returns the correct count', async () => {
        const count = await testDB.count()
        expect(count).toBe(6)
    })

    test('delete an the correct object', async () => {
        await testDB.del(1)
        const count = await testDB.count()
        expect(count).toBe(5)
    })

    test('find value using where', async () => {
        const [person] = await testDB.find({ where: (p) => p.lastname === 'simms' })
        expect(person).toEqual(people[4])
    })

    test('finds with limit', async () => {
        const result = await testDB.find({ limit: 3 })
        expect(result.length).toBe(3)
    })
})
