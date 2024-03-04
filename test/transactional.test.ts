import { Knex } from "knex";
import { TransactionProvider, configure } from "../src/index";
import { TestRepository } from "./test-repository";

type DbEntry = {
  table: string;
  value: any;
};

class FakeDb {
  entries: DbEntry[] = [];
  transactions: FakeTransaction[] = [];

  reset() {
    this.entries = [];
    this.transactions = [];
  }
}

const fakeDb = new FakeDb();

class FakeTransaction {
  status: "running" | "commited" | "rolled-back" = "running";
  entries: DbEntry[] = [];

  insert(value: any) {
    return {
      into: (table: string) => {
        this.entries.push({ table, value });
      },
    };
  }

  isCompleted() {
    return this.status !== "running";
  }

  commit() {
    fakeDb.entries.push(...this.entries);
    this.entries = [];
    fakeDb.transactions.push(this);
    this.status = "commited";
  }

  rollback() {
    this.entries = [];
    fakeDb.transactions.push(this);
    this.status = "rolled-back";
  }
}

const transactionProvider = {
  transaction: async () => new FakeTransaction() as any as Knex.Transaction,
};

configure(transactionProvider);

const repository: TestRepository = new TestRepository(new TransactionProvider());

describe("transactional", () => {
  beforeEach(() => {
    fakeDb.reset();
  });

  it("creates and commits a transaction on single decorated insert", async () => {
    await repository.simpleInsertTableOne();

    expect(fakeDb.entries.length).toBe(1);
    expect(fakeDb.transactions.length).toBe(1);
    expect(fakeDb.transactions[0].status).toBe("commited");
  });

  it("creates and commits a transaction for each different single decorated insert", async () => {
    await repository.simpleInsertTableOne();
    await repository.simpleInsertTableTwo();

    expect(fakeDb.entries.length).toBe(2);
    expect(fakeDb.transactions.length).toBe(2);
    expect(fakeDb.transactions[0].status).toBe("commited");
    expect(fakeDb.transactions[1].status).toBe("commited");
  });

  it("creates and commits a transaction for each single decorated insert with same function", async () => {
    await repository.simpleInsertTableOne();
    await repository.simpleInsertTableOne();

    expect(fakeDb.entries.length).toBe(2);
    expect(fakeDb.transactions.length).toBe(2);
    expect(fakeDb.transactions[0].status).toBe("commited");
    expect(fakeDb.transactions[1].status).toBe("commited");
  });

  it("creates and commits a single transaction for nested decorators", async () => {
    await repository.combinedInsert();

    expect(fakeDb.entries.length).toBe(2);
    expect(fakeDb.transactions.length).toBe(1);
    expect(fakeDb.transactions[0].status).toBe("commited");
  });

  it("rolls back the transaction if an error occurs", async () => {
    await repository.combinedInsertWithError();

    expect(fakeDb.entries.length).toBe(0);
    expect(fakeDb.transactions[0].status).toBe("rolled-back");
  });
});
