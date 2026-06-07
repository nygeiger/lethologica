import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { dbQuery } from "../config/db.js";
import env from "../config/env.js"

export async function executeMigrationScripts(folderPath: string) {
    try {
        // Returns an array of filenames in the directory
        const files = (await readdir(folderPath)).filter(f => f.endsWith(".sql")).sort();
        console.log("DB connection string: ", env.DATABASE_URL)
        for (const file of files) {
            const currentFilePath = join(folderPath, file)
            const sql = await readFile(currentFilePath, 'utf8');
            console.log(`Running database migration script at: ${currentFilePath}`)
            await dbQuery(sql);
        }
        console.log("All migration scripts ran successfully")
    } catch (err) {
        console.error("Error reading in migration scripts:", err);
    }
}

export async function executeSeedScripts(folderPath: string) {
    try {
        // Returns an array of filenames in the directory
        const files = (await readdir(folderPath)).filter(f => f.endsWith(".sql")).sort();
        console.log("DB connection string: ", env.DATABASE_URL)
        for (const file of files) {
            const currentFilePath = join(folderPath, file)
            const sql = await readFile(currentFilePath, 'utf8');
            console.log(`Running database seed script at: ${currentFilePath}`)
            await dbQuery(sql);
        }
        console.log("All seeding scripts ran successfully")
    } catch (err) {
        console.error("Error reading in migration scripts:", err);
    }
}