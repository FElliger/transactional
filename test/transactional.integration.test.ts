import { existsSync } from "fs";
import { unlink } from "fs/promises";
import knex, { Knex } from "knex";
import { TransactionProvider, configure } from "../src";
import { TestRepository } from "./test-repository";

describe("Transactional with actual DB", () => {
  const dbFileName = "./integrationtest.sqlite3";
  let knexInstance: Knex
  let testRepository: TestRepository

  beforeAll(async () => {
    if (existsSync(dbFileName)) {
      await unlink(dbFileName);
    }

    knexInstance = knex({
      client: "sqlite3",
      connection: {
        filename: dbFileName,
      },
      pool: {
        min: 5,
        max: 15,
      },
      useNullAsDefault: true,
    });

    await knexInstance.transaction(async (trx) => {
      await trx.schema.createTable("table_one", (table) => {
        table.string("key");
      });

      await trx.schema.createTable("table_two", (table) => {
        table.integer("number");
        table.string("string");
      });
    });

    configure(knexInstance);
  }, 15000);

  afterAll(async () => {
    if (knexInstance) { 
        await knexInstance.destroy()
    }
  })

  beforeEach(async () => {
    await knexInstance.transaction(async (trx) => {
        await trx.delete().from("table_one");
        await trx.delete().from("table_two");
    })

    testRepository = new TestRepository(new TransactionProvider());
  })

  it("creates entries for successful transaction", async () => {
    await testRepository.combinedInsert();

    await knexInstance.transaction(async (trx) => {
        const countOne = await trx.count().from("table_one");
        const countTwo = await trx.count().from("table_two");

        expect(countOne).toEqual([{ "count(*)": 1}])
        expect(countTwo).toEqual([{ "count(*)": 1}])
    })    
  });

  it("does not add entries if rollback is triggered by application error", async () => {
    await expect(() => testRepository.combinedInsertWithError()).rejects.toThrow("This is a forced error!");

    await knexInstance.transaction(async (trx) => {
        const countOne = await trx.count().from("table_one");
        const countTwo = await trx.count().from("table_two");

        expect(countOne).toEqual([{ "count(*)": 0}])
        expect(countTwo).toEqual([{ "count(*)": 0}])
    })
  })

  it("throws and rolls back on DB error", async () => {
    await expect(testRepository.combinedInsertWithBadInsert()).rejects.toThrow("no such table");
    
    await knexInstance.transaction(async (trx) => {
        const countOne = await trx.count().from("table_one");
        const countTwo = await trx.count().from("table_two");

        expect(countOne).toEqual([{ "count(*)": 0}])
        expect(countTwo).toEqual([{ "count(*)": 0}])
    })
  })
});
