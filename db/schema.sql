--- load with 
--- sqlite3 database.db < schema.sql

CREATE TABLE IF NOT EXISTS player (
	username VARCHAR(60) PRIMARY KEY,
	userpass VARCHAR(60) NOT NULL,
	age TINYINT NOT NULL,
	colour VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS stat (
	username VARCHAR(60) PRIMARY KEY,
	kills SMALLINT NOT NULL,
	deaths SMALLINT NOT NULL,
	damage INT NOT NULL,
	FOREIGN KEY (username) REFERENCES player(username) ON DELETE CASCADE
);
