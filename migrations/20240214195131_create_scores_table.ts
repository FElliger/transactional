import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("scores", (table) => {
        table.string("user_id");
        table.integer("score");
    })

    await knex.schema.createTable("attempts", (table) => {
        table.string("user_id");
        table.string("timestamp");
        table.boolean("successful");
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("scores");
    await knex.schema.dropTable("attempts");
}

