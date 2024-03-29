import { AsyncLocalStorage } from "async_hooks";
import { Knex } from "knex";

type KnexTransactionProvider = {
  transaction: () => ReturnType<Knex["transaction"]>;
};

let db: KnexTransactionProvider;
const localStorage = new AsyncLocalStorage();

export function configure(transactionProvider: KnexTransactionProvider) {
  db = transactionProvider;
}

export function transactional(originalMethod: any, context: ClassMethodDecoratorContext) {
  async function transactionalMethod(this: any, ...args: any[]) {
    if (!localStorage.getStore()) {
      return localStorage.run(
        {
          name: context.name,
          time: new Date().getTime(),
          transaction: await db.transaction(),
        },
        async () => {
          let result;
          try {
            result = await originalMethod.call(this, ...args);
          } catch (error) {
            const transaction = (localStorage.getStore() as any).transaction as Knex.Transaction;
            if (!transaction.isCompleted()) {
              console.log("Rolling back...");
              await transaction.rollback();
            }
            throw error;
          }

          try {
            const transaction = (localStorage.getStore() as any).transaction as Knex.Transaction;
            if (!transaction.isCompleted()) {
              console.log("Committing...");
              await transaction.commit();
            }
          } catch (error) {
            console.error("Commiting the transaction failed", error);
            throw error;
          }
          return result;
        },
      );
    }

    return originalMethod.call(this, ...args);
  }

  return transactionalMethod;
}

export function check() {
  console.log("Store:", localStorage.getStore());
}

export class TransactionProvider {
  getTransaction(): Knex.Transaction {
    if (localStorage.getStore()) {
      const transaction = (localStorage.getStore() as any).transaction as Knex.Transaction;
      return transaction;
    }

    throw new Error("No exists! Did you decorate your method with '@transactional'?");
  }
}
