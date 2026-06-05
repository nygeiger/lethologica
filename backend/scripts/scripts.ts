import { executeMigrationScripts } from "../src/db/migrate.js";
import { db_migration_folder } from "../src/utils/constants.js";

const taskName = process.argv[2]

const run = async () => {
    switch (taskName) {
        case "db_migrate":
            await executeMigrationScripts(db_migration_folder)
            break
        case "hello_world":
            console.log("Hello World")
            break
        default:
            console.log("ERROR: Unknown script")
            process.exit(1)
    }
}

run()