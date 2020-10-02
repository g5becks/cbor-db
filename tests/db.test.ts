import { DB } from '../src'
type Person = { id: number; firstname: string; lastname: string; age: number; address: string }
const testDB = DB.create<Person>(':mem:')

test('DB should return the correct person object', async () => {
    const data = [{ id: 1, firstname: 'gary', lastname: 'becks', address: '', age: 32 }]
    await testDB.put(data[0])
    const person = await testDB.get(1)
    console.log(JSON.stringify(person))
    expect(person).toEqual(data)
})
