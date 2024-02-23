import type { Knex } from "knex";

export const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3"
    },
    pool: {
      min: 5,
      max: 15
    },
    useNullAsDefault: true
  },

};

export default config
