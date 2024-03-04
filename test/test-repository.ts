import { TransactionProvider, transactional } from "../src";

export class TestRepository {
  constructor(private readonly transactionProvider: TransactionProvider) {}

  @transactional
  async simpleInsertTableOne(): Promise<void> {
    const transaction = this.transactionProvider.getTransaction();

    await transaction.insert({ key: "value" }).into("table_one");
  }

  @transactional
  async simpleInsertTableTwo(): Promise<void> {
    const transaction = this.transactionProvider.getTransaction();

    await transaction.insert({ number: 1, string: "one" }).into("table_two");
  }

  @transactional
  async combinedInsert(): Promise<void> {
    await this.simpleInsertTableOne();
    await this.simpleInsertTableTwo();
  }

  @transactional
  async combinedInsertWithError(): Promise<void> {
    await this.simpleInsertTableOne();
    this.forceError();
    await this.simpleInsertTableTwo();
  }

  forceError() {
    throw new Error("This is a forced error!");
  }
}
