// src/lib/server/db.js
import { env } from '$env/dynamic/private';
import pg from 'pg';

const { Pool } = pg;
console.log("DB_USER:", env.DB_USER);
console.log("DB_PASS is undefined?", env.DB_PASSWORD === undefined);

export const pool = new Pool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME
});
