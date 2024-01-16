import mysql from "mysql2";
import inquirer from "inquirer";
import fs from "fs";

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

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  multipleStatements: true,
});

conn.query(queryToExe, (err, res) => {
  if (err) {
    console.log(err);
    process.exit();
  } else {
    for (let i = 0; i < res.length; i++) {
      if (i <= 2) continue;
      console.log(res[i]);
    }
    process.exit();
  }
});
