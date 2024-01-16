//Import stuff
import inquirer from "inquirer";
import express from "express";
import mysql from "mysql2";
import dotenv from "dotenv";
import chalk from "chalk";
dotenv.config();

const baseFetchUrl = `${process.env.protocol}://${process.env.db_hostname}:${process.env.port}`;

//Function to clean string of all special chars and only keep a-z and A-Z
const cleanSQLString = (string) => {
  //Split string into characters, check each character against regex for a-z or A-Z, then join it back with nothing and return
  return string
    .split("")
    .filter((char) => {
      return char.match(/[a-zA-Z ]/);
    })
    .join("");
};

//Basically the same as the function above only the passed param may be a number so convert to string first + 0-9 check in regex
//and a . as well for decimals
const cleanSQLStringWithNums = (string) => {
  return String(string)
    .split("")
    .filter((char) => {
      return char.match(/[a-zA-Z0-9.]/);
    })
    .join("");
};

//Create an express app
const app = new express();

//Set up parsing for body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Create connection with env vars
const conn = mysql.createConnection({
  host: process.env.db_hostname,
  user: process.env.db_username,
  password: process.env.db_password,
});

//Create a promisified version of the conn.query to be able to wait for conn.query before continuing
import util from "util";
const promisedQuery = util.promisify(conn.query).bind(conn);

//Try to use the company_db, if error need to create it
try {
  await promisedQuery("USE company_db;");
} catch (err) {
  console.clear();
  console.log(`${chalk.red(err + ", have you run 'npm run setup'?")}`);
  process.exit();
}
console.clear();

//Set up view route for department, role, and employee tables
app.get("/api/view/:viewType", async (req, res) => {
  console.log(cleanSQLString(req.params.viewType));
  let queryRes = await promisedQuery(
    `SELECT * FROM ${cleanSQLString(req.params.viewType)};`
  );
  if (queryRes.length > 0) res.json(queryRes);
  else res.status(200).json(`No items in the ${req.params.viewType} table`);
});

//Set up post route for department, role, and employee tables
app.post("/api/create/:dataType", async (req, res) => {
  let dataType = cleanSQLString(req.params.dataType);
  console.log(dataType);

  let columnNames;
  let values;
  switch (dataType) {
    case "department":
      if (!req.body.name) {
        res
          .status(500)
          .json("Must set a name parameter on the body to create a department");
        return;
      }
      columnNames = "(name)";
      values = `("${cleanSQLString(req.body.name)}")`;
      break;
    case "role":
      if (!req.body.title || !req.body.salary || !req.body.department_id) {
        res
          .status(500)
          .json(
            "Must set a title, salary, and department_id parameter on the body to create a role"
          );
        return;
      }
      columnNames = "(title, salary, department_id)";
      values = `("${cleanSQLString(req.body.title)}", ${Number(
        cleanSQLStringWithNums(req.body.salary)
      ).toFixed(2)}, ${Number(
        cleanSQLStringWithNums(req.body.department_id)
      )})`;
      break;
    case "employee":
      if (
        !req.body.first_name ||
        !req.body.last_name ||
        !req.body.role_id ||
        !req.body.manager_id
      ) {
        res
          .status(500)
          .json(
            "Must set a first_name, last_name, role_id, and manager_id parameter on the body to create an employee"
          );
        return;
      }
      columnNames = "(first_name, last_name, role_id, manager_id)";
      values = `("${cleanSQLString(req.body.first_name)}", "${cleanSQLString(
        req.body.last_name
      )}", ${Number(cleanSQLStringWithNums(req.body.role_id))}, ${Number(
        cleanSQLStringWithNums(req.body.manager_id)
      )})`;
      break;
  }

  console.log(columnNames, values);
  try {
    await promisedQuery(
      `INSERT INTO ${dataType} ${columnNames} VALUES ${values};`
    );
  } catch (err) {
    res.status(500).json(`Error creating entry in ${dataType} table`);
    return;
  }
  res.status(200).json(`Added ${values} into the ${dataType} table`);
});

//Set up patch route for updating a created entry in the department, role, and employee tables
app.patch("/api/update/:targetTable/:id", async (req, res) => {
  let table = cleanSQLString(req.params.targetTable);
  let id = cleanSQLStringWithNums(req.params.id);

  let objKeys = Object.keys(req.body);
  let objVals = Object.values(req.body);

  let updateVals = "";

  for (let i = 0; i < objKeys.length; i++) {
    if (typeof objVals[i] === "string") objVals[i] = '"' + objVals[i] + '"';
    if (i > 0) updateVals += ", ";
    updateVals += "" + objKeys[i] + "=" + objVals[i];
  }

  try {
    await promisedQuery(`UPDATE ${table} SET ${updateVals} WHERE id=${id};`);
  } catch (err) {
    res.status(500).json(`Error updating entry in ${table} table, ${err}`);
    return;
  }
  res
    .status(200)
    .json(`Updated ${updateVals} at id ${id} in the ${table} table`);
});

//Set up delete route for deleting a created entry in the department, role, and employee tables
app.delete("/api/delete/:targetTable/:id", async (req, res) => {
  let table = cleanSQLString(req.params.targetTable);
  let id = cleanSQLStringWithNums(req.params.id);

  try {
    let queryRes = await promisedQuery(`DELETE FROM ${table} WHERE id=${id};`);
    res.status(200).json(`Success, deleted id ${id} from ${table}`);
  } catch (err) {
    res.status(500).json(`Error removing entry in ${table} table, ${err}`);
    return;
  }
});

//Figure out if user wants to run in web or in cli
const webAppOrCLI = await inquirer.prompt({
  name: "choice",
  type: "list",
  message: "How would you like to run this app?",
  choices: ["Web App", "Command Line Interface"],
});

//Setup for web app
if (webAppOrCLI.choice == "Web App") {
  const port = 3000;

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
  app.listen(process.env.port || port, console.log(`Running in CLI mode!`));
  //view all departments, view all roles, view all employees, add a department, add a role, add an employee, and update an employee role

  let exitApp = false;

  while (!exitApp) {
    let action = await inquirer.prompt({
      type: "list",
      name: "choice",
      message: "What would you like to do?",
      choices: ["View"],
    });

    switch (action.choice) {
      case "View":
        let table = await inquirer.prompt({
          type: "list",
          name: "choice",
          message: "Which table would you like to view?",
          choices: ["Departments", "Roles", "Employees"],
        });

        let tableName = String(table.choice)
          .toLowerCase()
          .substring(0, table.choice.length - 1);

        let res = await fetch(`${baseFetchUrl}/api/view/${tableName}`);

        let json = await res.json();
        console.log(json);
        break;
    }
  }

  process.exit();
}
