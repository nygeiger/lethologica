import { executeMigrationScripts, executeSeedScripts } from "../src/db/migrate.js";
import { db_migration_folder, db_seeding_folder } from "../src/utils/constants.js";
import logger from "../src/utils/logger.js";

const taskName = process.argv[2]

const run = async () => {
    switch (taskName) {
        case "db_migrate":
            await executeMigrationScripts(db_migration_folder)
            break
        case "db_seed":
            await executeSeedScripts(db_seeding_folder)
            break
        case "hello_world":
            logger.info("Hello World")
            break
        default:
            logger.info("ERROR: Unknown script")
            process.exit(1)
    }
}

run()