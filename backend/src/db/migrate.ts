import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { dbQuery } from "../config/db.js";
import env from "../config/env.js"
import logger from '../utils/logger.js';

export async function executeMigrationScripts(folderPath: string) {
    try {
        await dbQuery(`CREATE TABLE IF NOT EXISTS migrations (filename TEXT NOT NULL UNIQUE, run_at TIMESTAMPTZ DEFAULT NOW())`)
        const migratedFiles = (await dbQuery<{ filename: string }>(`SELECT filename FROM migrations`)).rows.map(f => f.filename)

        // Returns an array of filenames in the directory
        const files = (await readdir(folderPath)).filter(f => f.endsWith(".sql")).sort();

        logger.debug(`DB connection string: , ${env.DATABASE_URL}`)
        for (const file of files) {
            const currentFilePath = join(folderPath, file)
            if (migratedFiles.includes(file)) {
                continue;
            } else {

                const sql = await readFile(currentFilePath, 'utf8');
                logger.info(`Running database migration script at: ${currentFilePath}`)
                await dbQuery(sql);
                await dbQuery("INSERT INTO migrations (filename) VALUES ($1)", [file])
            }
        }
       logger.info("All migration scripts ran successfully")
    } catch (err) {
        logger.error(err, "Error reading in migration scripts");
    }
}

export async function executeSeedScripts(folderPath: string) {
    try {
        // Returns an array of filenames in the directory
        const files = (await readdir(folderPath)).filter(f => f.endsWith(".sql")).sort();
        logger.info(`DB connection string: , ${env.DATABASE_URL}`)
        for (const file of files) {
            const currentFilePath = join(folderPath, file)
            const sql = await readFile(currentFilePath, 'utf8');
            logger.info(`Running database seed script at: ${currentFilePath}`)
            await dbQuery(sql);
        }
       logger.info("All seeding scripts ran successfully")
    } catch (err) {
        logger.error(err, "Error reading in migration scripts");
    }
}