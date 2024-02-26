import { AttemptRepository } from "./attempt-repository";
import { ScoreRepository } from "./score-repository";
import { transactional } from "../src";

export class MyFunctions {
    constructor(private readonly scores: ScoreRepository, private readonly attempts: AttemptRepository) {}

    @transactional
    async saveAttemptAndScore(userId: string, score: number) {
        await this.attempts.saveAttempt(userId, score > 5);
        await this.scores.saveScore(userId, score);
    }
}



