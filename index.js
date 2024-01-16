import inquirer from "inquirer";
import express from "express";
import mysql from "mysql2";
import dotenv from "dotenv";
import util from "util";
import chalk from "chalk";

const app = new express();
dotenv.config();

const conn = mysql.createConnection({
  host: process.env.db_hostname,
  user: process.env.db_username,
  password: process.env.db_password,
});
const promisedQuery = util.promisify(conn.query).bind(conn);

try {
  await promisedQuery("USE company_db;");
} catch (err) {
  console.clear();
  console.log(`${chalk.red(err + ", have you run 'npm run setup'?")}`);
  process.exit();
}
console.log("testing");

console.clear();
const webAppOrCLI = await inquirer.prompt({
  name: "choice",
  type: "list",
  message: "How would you like to run this app?",
  choices: ["Web App", "Command Line Interface"],
});

if (webAppOrCLI.choice == "Web App") {
  const port = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(express.static(`${process.cwd()}/src/pages/`));
  app.use(express.static(`${process.cwd()}/src/scripts/`));

  app.get("*", (req, res, next) => {
    console.log(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
    next();
  });

  app.get("/", (req, res) => {
    res.sendFile("homepage/homepage.html", { root: "src/pages" });
  });

  app.listen(
    process.env.port || port,
    console.log(`App listening on http://localhost:${process.env.port || port}`)
  );
} else {
  console.log("Running in CLI mode!");
}
