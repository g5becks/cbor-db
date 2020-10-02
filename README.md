# Cbor-DB

An embedded database for typescript and nodejs. Built as a tiny wrapper around leveldb using [borc](https://www.npmjs.com/package/borc).

## Overview

Cbor-DB is a performant database designed for embedded projects and low traffic web apps. It uses [cbor](https://cbor.io/) for encoding instead of json
which enables smaller storage size as well as storage of arbitrary blobs.

Cbor-DB is based on [Depot-DB](https://www.npmjs.com/package/depot-db), like Depot-DB, it has a different, yet familiar query language. Typescript.

In cbor-db the "where" is a function that is passed all of the documents in the db.

If the function returns true, the document is added to the collection, otherwise
it is ignored.

The same goes for "sort". The sort function is passed two documents ("a" and "b") and returns
a number determining which one goes first. If the sort function returns a number greater than
zero "a" is at a higher index than "b", less than zero and "b" comes first. If it returns 0
they "a" and "b" equivelent.

## Installation

```bash
npm i --save cbor-db
```

## Basic Usage

```typescript
import { DB } from "cbor-db";

// Define a document type
type Person = { firstname: string; lastname: string; age: number };

// Initialize a people database (Stored in /databases/people)
const people = new Depot<Person>("/databases/people");

// Store some people
people.put("John", { firstname: "John", lastname: "Doe", age: 32 });
people.put("Jane", { firstname: "Jane", lastname: "Doe", age: 32 });
people.put("Tim", { firstname: "Tim", lastname: "Burton", age: 59 });
people.put("Tony", { firstname: "Stark", lastname: "Doe", age: 45 });

// Query people
people
  .find({
    where: (person) => person.age > 32,
  })
  .then((personsOlderThat32) => {
    // personsOlderThat32 = [
    //     { firstname: "Tim", lastname: "Burton", age: 61 },
    //     { firstname: "Stark", lastname: "Doe", age: 53 }
    // ];
  });

// Find a person by their key (rejects if person is not found)
people.get("John").then(/** { firstname: "John", lastname: "Doe", age: 32 } */);
```

## API

API documentation can be found [here](https://youngwerth.gitlab.io/depot)
