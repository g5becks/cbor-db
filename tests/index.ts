import { DB } from '../src'
type Person = { id: number; firstname: string; lastname: string; age: number; address: string }
const testDB = DB.create<Person>(':mem:')

test('DB should return the correct person object', async () => {
    await testDB.put({ id: 1, firstname: 'gary', lastname: 'becks', address: '', age: 32 })
})
describe('Depot', function () {
    type Person = { firstname: string; lastname: string; age: number; address: string }

    it('Stores a document', function () {
        return testDB.put('Drew', {
            firstname: 'Drew',
            lastname: 'Youngwerth',
            age: 22,
            address: 'Nonya',
        })
    })

    it('Gets a document', function () {
        return testDB.get('Drew')
    })

    it('Deletes a document', function () {
        return testDB.del('Drew')
    })

    const people = ['Diamond', 'Candy', 'Tiffany', 'Sparkle', 'Glitter', 'Simon']
    let age = 18
    for (const personStr of people) {
        testDB.put(personStr, {
            firstname: personStr,
            lastname: personStr,
            age: age,
            address: personStr,
        })
        age++
    }

    it('Finds with a where', function () {
        return testDB.find({ where: (person) => person.age > 20 }).then((people) => {
            assert.equal(people.length, 3)
        })
    })

    it('Finds with a limit', function () {
        return testDB.find({ limit: 4 }).then((people) => {
            assert.equal(people.length, 4)
        })
    })
})
