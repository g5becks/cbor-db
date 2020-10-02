# Cbor-DB

An embedded database for typescript and nodejs. Built as a tiny wrapper around [level](https://www.npmjs.com/package/level) using [borc](https://www.npmjs.com/package/borc) for encoding.

## Overview

Cbor-DB is a performant database designed for embedded projects and low traffic web apps. It uses [cbor](https://cbor.io/) for encoding instead of json
which enables smaller storage size as well as storage of arbitrary blobs.

Cbor-DB is loosely based on [Depot-DB](https://www.npmjs.com/package/depot-db), like Depot-DB, it has a different, yet familiar query language. Typescript.

In cbor-db the "where" is a function that is passed all of the documents in the db.

If the function returns true, the document is added to the collection, otherwise
it is ignored. This is simple and yet performs well thanks to the use of [streams](https://www.npmjs.com/package/level#dbcreatereadstreamoptions).

The same goes for "sort". The sort function is passed two documents ("a" and "b") and returns
a number determining which one goes first. If the sort function returns a number greater than
zero "a" is at a higher index than "b", less than zero and "b" comes first. If it returns 0
they "a" and "b" equivalent.

## Installation

```bash
npm i --save cbor-db
```

## Basic Usage

```typescript
import { DB } from 'cbor-db'

// Define a document type.
// All documents must have a readonly id field
// that is of type string | number
type Person = {
    id: string
    firstname: string
    lastname: string
    age: number
}

// Initialize a people database (Stored in /databases/people)
// If running in node, the directory will be created if it
// doesn't exist.
const people = DB.create<Person>('/databases/people')

// You can also create an in memory DB that
// uses memdown. Useful for development and testing.
const inMemPeope = DB.create<Person>(':mem:')

// Store some people
people.put({ id: 1, firstname: 'John', lastname: 'Doe', age: 32 })
people.put({ id: 2, firstname: 'Jane', lastname: 'Doe', age: 32 })
people.put({ id: 3, firstname: 'Tim', lastname: 'Burton', age: 59 })
people.put({ id: 4, firstname: 'Stark', lastname: 'Doe', age: 45 })

// Query people
const findPeopleOlderThan = async (age: number): Promise<Person[]> =>
    people.find({
        where: (person) => person.age > age,
    })

// Find a person by their key (rejects if person is not found)
const getPersonById = async (id: number): Promise<Person> => people.get(1)

const tryItOut = async () => {
    const found = await findPeopleOlderThan(40)
    found.forEach((p) => {
        console.log(p.firstname)
        // Tim
        // Stark
    })

    const person = await getPersonById(1)
    console.log(person.firstname) // 'John'
}
```

## API

API documentation can be found [here](https://youngwerth.gitlab.io/depot)
