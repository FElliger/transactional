import { AttemptRepository } from "./attempt-repository";
import { MyFunctions } from "./functions"
import { ScoreRepository } from "./score-repository";
import { TransactionProvider, configure } from "../src";
import knex from "knex";
import config from "../knexfile";

const knexInstance = knex(config.development)
configure(knexInstance)

const transactionProvider = new TransactionProvider();
const scores = new ScoreRepository(transactionProvider);
const attempts = new AttemptRepository(transactionProvider);
const functions = new MyFunctions(scores, attempts);

const usersWithScore = [ 5, 1, 2 ].map((score) => {
    return {
        userId: `user${score}`,
        score,
    }
})


 Promise.all(usersWithScore.map((userWithScore) => functions.saveAttemptAndScore(userWithScore.userId, userWithScore.score)))
   .then(() => scores.getScoreCount())
   .then((count) => console.log("Score count", count))
   

// scores.getScoreCount().then(() => functions.saveAttemptAndScore("me", 13)).then(() => scores.getScoreCount())
