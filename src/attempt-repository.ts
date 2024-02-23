import { TransactionProvider, transactional } from "./transactional";

export class AttemptRepository {
    constructor(private readonly transactionProvider: TransactionProvider) {}

    @transactional
    async saveAttempt(userId: string, success: boolean) {
        await this.transactionProvider.getTransaction().insert({
            user_id: userId,
            timestamp: new Date().toISOString(),
            successful: success
        }).into("attempts");
    }
}
    