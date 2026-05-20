import { defineConfig } from "prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
  migrate: {
    adapter(env) {
      const pool = new Pool({
        connectionString: env.DIRECT_URL || env.DATABASE_URL,
      });
      return new PrismaPg(pool);
    },
  },
});
