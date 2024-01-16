import mysql from "mysql2";
import inquirer from "inquirer";
import fs from "fs";
import dotenv from "dotenv";
import chalk from "chalk";

console.clear();
const delOrSetup = await inquirer.prompt({
  name: "choice",
  type: "list",
  message: "What would you like to do?",
  choices: ["Setup Database", "Delete Database"],
});

let queryToExe;

if (delOrSetup.choice == "Setup Database")
  queryToExe = fs.readFileSync(`${process.cwd()}/src/db/schema.sql`).toString();
else if (delOrSetup.choice == "Delete Database")
  queryToExe = fs.readFileSync(`${process.cwd()}/src/db/wipe.sql`).toString();

dotenv.config();
const conn = mysql.createConnection({
  host: process.env.db_hostname,
  user: process.env.db_username,
  password: process.env.db_password,
  multipleStatements: true,
});

conn.query(queryToExe, (err, res) => {
  if (err) {
    console.log(`${chalk.red(err)}`);
    process.exit();
  } else {
    if (delOrSetup.choice == "Setup Database") {
      console.log(chalk.green("Database Has Been Configured"));
    } else {
      console.log(chalk.green("Database Has Been Deleted"));
    }

    process.exit();
  }
});
