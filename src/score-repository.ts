import { TransactionProvider, transactional } from "./transactional";

export class ScoreRepository {
    constructor(private readonly transactionProvider: TransactionProvider) {}

    @transactional
    async saveScore(userId: string, score: any) {
        await this.transactionProvider.getTransaction().insert({
            user_id: userId,
            score
        }).into("scores");
    }

    @transactional
    async getScoreCount() {
        const result = await this.transactionProvider.getTransaction().count().from("scores");
        
        console.log(result)
        return (result as any)["count()"];
    }
}