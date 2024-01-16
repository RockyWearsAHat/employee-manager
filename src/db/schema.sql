CREATE DATABASE IF NOT EXISTS company_db;

USE company_db;

CREATE TABLE IF NOT EXISTS department (
    id int PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name varchar(30)
);

CREATE TABLE IF NOT EXISTS role (
    id int PRIMARY KEY NOT NULL AUTO_INCREMENT,
    title varchar(30),
    salary decimal,
    department_id int,
    FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employee (
    id int PRIMARY KEY NOT NULL AUTO_INCREMENT,
    first_name varchar(30),
    last_name varchar(30),
    role_id int,
    manager_id int,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE SET NULL
);

SELECT DATABASE();
SHOW TABLES;