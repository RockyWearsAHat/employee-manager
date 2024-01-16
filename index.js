import inquirer from "inquirer";
import express from "express";
import mysql from "mysql2";

const app = new express();

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "company_db",
});

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
