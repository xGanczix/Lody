const express = require("express");
const mariadb = require("mariadb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { exec } = require("child_process");

const appPort = 3000;
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());

dotenv.config();

const fs = require("fs");
const path = require("path");

function logToFile(message) {
  try {
    const date = new Date();
    const offsetDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    const dateString = offsetDate.toISOString().split("T")[0];
    const logFileName = `log_${dateString}.log`;
    const logFilePath = path.join(__dirname, "logs", logFileName);

    const logMessage = `[${offsetDate
      .toISOString()
      .replace("T", " ")
      .slice(0, 19)}] ${message}\n`;

    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    console.error("Błąd zapisu do logu:", err);
  }
}

function handleExit(signal) {
  logToFile(`[INFO] Aplikacja zamknięta przez: ${signal}`);
  process.exitCode = 0;
  setTimeout(() => process.exit(), 100);
}

process.on("exit", () => logToFile("[INFO] Aplikacja zakończyła działanie."));
process.on("beforeExit", () =>
  logToFile("[INFO] Aplikacja kończy działanie (beforeExit).")
);
process.on("SIGINT", () => handleExit("SIGINT (CTRL+C lub pm2 stop)"));
process.on("SIGTERM", () => handleExit("SIGTERM (pm2 stop lub kill)"));
process.on("SIGHUP", () => handleExit("SIGHUP (restart systemu lub pm2 stop)"));
process.on("uncaughtException", (err) => {
  logToFile(`[ERROR] Nieobsłużony błąd: ${err.message}`);
  process.exit(1);
});

const SECRET_KEY = process.env.JWT_SECRET;
const APP_LOGIN = process.env.APP_LOGIN;
const APP_HASLO = process.env.APP_HASLO;

const dbConfig = mariadb.createPool({
  host: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 50,
  queueLimit: 0,
});

dbConfig
  .getConnection()
  .then((connection) => {
    logToFile("[INFO] Połączono z MariaDB");
    connection.release();
  })
  .catch((err) => {
    logToFile(`[ERROR] Błąd połączenia z MariaDB: ${err}`);
  });

app.post("/api/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Brak tokenu" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Nieprawidłowy lub wygasły token" });
    }
    res.json({ message: "Token prawidłowy", user: decoded });
  });
});

app.post("/api/login", async (req, res) => {
  const { login, password } = req.body;

  let connection;
  try {
    if (login === APP_LOGIN) {
      const passwordMatch = await bcrypt.compare(password, APP_HASLO);
      if (passwordMatch) {
        const token = jwt.sign(
          {
            id: "123456789",
            login: "pinnex",
            imie: "Pinnex",
            nazwisko: "Info",
          },
          SECRET_KEY,
          { expiresIn: "12h" }
        );
        logToFile("[INFO] Zalogowano Serwis");
        return res.json({ message: "Zalogowano pomyślnie", token });
      }
    }

    connection = await dbConfig.getConnection();
    const rows = await connection.query(
      "SELECT * FROM Uzytkownicy WHERE UzLogin = ? AND UzStatus = 1",
      [login]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło" });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.UzHaslo);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło" });
    }

    const token = jwt.sign(
      {
        id: user.UzId,
        login: user.UzLogin,
        imie: user.UzImie,
        nazwisko: user.UzNazwisko,
      },
      SECRET_KEY,
      { expiresIn: "8h" }
    );
    logToFile(`[INFO] Zalogowano: ${login}`);
    res.json({ message: "Zalogowano pomyślnie", token });
  } catch (err) {
    logToFile(`[ERROR] ${err}`);
    res.status(500).json({ message: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/login-pin", async (req, res) => {
  const { pinSklep, pin } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();

    const rows = await connection.query(
      "SELECT * FROM Uzytkownicy WHERE UzStatus = 1"
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Nieprawidłowy PIN" });
    }

    let user = null;
    for (const row of rows) {
      const PINMatch = await bcrypt.compare(pin, row.UzPIN);
      if (PINMatch) {
        user = row;
        break;
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Nieprawidłowy PIN" });
    }

    const sklepRow = await connection.query(
      "SELECT SklNazwa FROM Sklepy WHERE SklId = ?",
      [pinSklep]
    );

    const sklepNazwa = sklepRow.length > 0 ? sklepRow[0].SklNazwa : null;

    const token = jwt.sign(
      {
        id: user.UzId,
        login: user.UzLogin,
        imie: user.UzImie,
        nazwisko: user.UzNazwisko,
        sklepId: pinSklep,
        sklepNazwa: sklepNazwa,
      },
      SECRET_KEY,
      { expiresIn: "8h" }
    );

    logToFile(`[INFO] Zalogowano: ${user.UzLogin} (Sklep: ${sklepNazwa})`);
    res.json({ message: "Zalogowano pomyślnie", token });
  } catch (err) {
    logToFile(`[ERROR] ${err}`);
    res.status(500).json({ message: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/uzytkownicy", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    const status = req.query.status || "aktywne";

    let sql = "SELECT * FROM Uzytkownicy";
    if (status === "aktywne") {
      sql +=
        " WHERE UzStatus = 1 AND UzLogin != 'admin' ORDER BY UzStatus DESC,UzID";
    } else if (status === "usuniete") {
      sql +=
        " WHERE UzStatus = 0 AND UzLogin != 'admin' ORDER BY UzStatus DESC,UzId";
    } else {
      sql += " AND UzLogin != 'admin' ORDER BY UzStatus DESC,UzId";
    }

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/uzytkownik-dodanie", async (req, res) => {
  const {
    uzytkownikImie,
    uzytkownikNazwisko,
    uzytkownikLogin,
    uzytkownikHaslo,
    uzytkownikPIN,
    uzytkownikStawkaGodzinowa,
  } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();

    const existingUsers = await connection.query(
      "SELECT UzLogin, UzPIN FROM Uzytkownicy WHERE UzLogin = ? OR UzPIN IS NOT NULL",
      [uzytkownikLogin]
    );

    let errorMessages = [];

    if (
      existingUsers.some((user) => user.UzLogin === uzytkownikLogin) ||
      uzytkownikLogin === "pinnex"
    ) {
      errorMessages.push("Podany login już istnieje.");
    }

    for (const user of existingUsers) {
      if (user.UzPIN && uzytkownikPIN) {
        const pinMatch = await bcrypt.compare(uzytkownikPIN, user.UzPIN);
        if (pinMatch) {
          errorMessages.push("Podany PIN już istnieje.");
          break;
        }
      }
    }

    if (errorMessages.length > 0) {
      return res.status(400).json({ error: errorMessages.join(" ") });
    }

    const hashedPassword = uzytkownikHaslo
      ? await bcrypt.hash(uzytkownikHaslo, 10)
      : null;
    const hashedPIN = uzytkownikPIN
      ? await bcrypt.hash(uzytkownikPIN, 10)
      : null;

    await connection.query(
      "INSERT INTO Uzytkownicy(UzImie, UzNazwisko, UzLogin, UzHaslo, UzPIN, UzStawkaGodzinowa) VALUES (?,?,?,?,?,?)",
      [
        uzytkownikImie,
        uzytkownikNazwisko,
        uzytkownikLogin || "",
        hashedPassword,
        hashedPIN,
        uzytkownikStawkaGodzinowa || null,
      ]
    );
    logToFile(`[INFO] Użytkownik dodany pomyślnie: ${uzytkownikLogin}`);
    res.status(201).json({ message: "Użytkownik dodany pomyślnie." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania użytkownika: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/uzytkownicy-usuwanie/:id", async (req, res) => {
  const uzytkownikId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Uzytkownicy SET UzStatus = 0, UzDataZmiany = NOW() WHERE UzId = ?",
      [uzytkownikId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Usunięcie użytkownika o ID: ${uzytkownikId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/uzytkownicy-przywracanie/:id", async (req, res) => {
  const uzytkownikId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Uzytkownicy SET UzStatus = 1, UzDataZmiany = NOW() WHERE UzId = ?",
      [uzytkownikId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Przywrócenie użytkownika o ID: ${uzytkownikId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/smaki", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    const status = req.query.status || "aktywne";

    let sql = "SELECT * FROM Smaki";
    if (status === "aktywne") {
      sql += " WHERE SmkStatus = 1 ORDER BY SmkStatus DESC, SmkId";
    } else if (status === "usuniete") {
      sql += " WHERE SmkStatus = 0 ORDER BY SmkStatus DESC, SmkId";
    } else {
      sql += " ORDER BY SmkStatus DESC, SmkId";
    }

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/kuwety-sklep/:sklepId", async (req, res) => {
  const { sklepId } = req.params;
  let connection;
  try {
    connection = await dbConfig.getConnection();

    let sql = `
    select
	k.KuwId as Id,
	    s.SmkNazwa as Nazwa,
	    s.SmkKolor as Kolor,
	s.SmkTekstKolor as TekstKolor,
	    r.RozPojemnosc as Pojemnosc,
	    k.KuwPorcje as Porcje,
	    s.SmkTowId,
	    c.CCena
from
	    Kuwety as k
left join Rozmiary as r on
	    r.RozId = k.KuwRozId
left join Smaki as s on
	    s.SmkId = k.KuwSmkId
left join Ceny as c on
	c.CTowId = s.SmkTowId
where
	k.KuwSklId = ? and k.KuwStatus = 1 and c.CSklepId = ?`;

    const data = await connection.query(sql, [sklepId, sklepId]);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/kuwety-usuwanie/:id", async (req, res) => {
  const kuwetaId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Kuwety SET KuwStatus = 0, KuwDataZmiany = NOW() WHERE KuwId = ?",
      [kuwetaId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Usunięcie kuwety o ID: ${kuwetaId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/smaki-dodanie", async (req, res) => {
  const { smak, kolor, textColor } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "INSERT INTO Smaki (SmkNazwa,SmkKolor,SmkTekstKolor) VALUES (?,?,?)",
      [smak, kolor, textColor]
    );
    logToFile(`[INFO] Smak dodany pomyślnie: ${smak}`);
    res.status(201).json({ message: "Smak dodany pomyślnie." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania smaku: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/smaki-usuwanie/:id", async (req, res) => {
  const smakId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query("UPDATE Smaki SET SmkStatus = 0 WHERE SmkId = ?", [
      smakId,
    ]);
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Usunięcie smaku o ID: ${smakId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/smaki-przywracanie/:id", async (req, res) => {
  const smakId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query("UPDATE Smaki SET SmkStatus = 1 WHERE SmkId = ?", [
      smakId,
    ]);
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Przywrócenie smaku o ID: ${smakId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/rozmiary", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    const status = req.query.status || "aktywne";

    let sql = "SELECT * FROM Rozmiary";
    if (status === "aktywne") {
      sql += " WHERE RozStatus = 1 ORDER BY RozStatus DESC, RozId";
    } else if (status === "usuniete") {
      sql += " WHERE RozStatus = 0 ORDER BY RozStatus DESC, RozId";
    } else {
      sql += " ORDER BY RozStatus DESC, RozId";
    }

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/rozmiary-dodanie", async (req, res) => {
  const { rozmiarNazwa, rozmiarPojemnosc } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "INSERT INTO Rozmiary (RozNazwa,RozPojemnosc) VALUES (?,?)",
      [rozmiarNazwa, rozmiarPojemnosc]
    );
    logToFile(`[INFO] Rozmiar dodany pomyślnie: ${rozmiarNazwa}`);
    res.status(201).json({ message: "Rozmiar dodany pomyślnie." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania rozmiaru: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/tworzenie-bazy", async (req, res) => {
  let connection;
  const pool = mariadb.createPool({
    host: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 50,
    queueLimit: 0,
  });
  try {
    connection = await pool.getConnection();
    await connection.query("create database lody_lacko");
    logToFile("[INFO] Baza danych utworzona poprawnie");
    res.status(200).json({ message: "Baza danych utworzona poprawnie" });
  } catch (err) {
    logToFile("[ERROR] Błąd tworzenia bazy danych");
    res.status(500).json({ error: "Błąd tworzenia bazy danych" });
  }
});

app.put("/api/rozmiary-usuwanie/:id", async (req, res) => {
  const rozmiarId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Rozmiary SET RozStatus = 0 WHERE RozId = ?",
      [rozmiarId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Usunięcie rozmiaru o ID: ${rozmiarId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/rozmiary-przywracanie/:id", async (req, res) => {
  const rozmiarId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Rozmiary SET RozStatus = 1, RozDataZmiany = now() WHERE RozId = ?",
      [rozmiarId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Przywrócenie rozmiaru o ID: ${rozmiarId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/kuwety-przywracanie/:id", async (req, res) => {
  const kuwetaId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Kuwety SET KuwStatus = 1, KuwDataZmiany = now() WHERE KuwId = ?",
      [kuwetaId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Przywrócenie kuwety o ID: ${kuwetaId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/sklepy", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    const status = req.query.status || "aktywne";
    const uzytkownikId = req.query.uzytkownik;

    let sql = `select
	s.SklId,
	s.SklNazwa,
	s.SklUlica,
	s.SklNumer,
	s.SklKod,
	s.SklMiejscowosc,
	s.SklPojemnosc,
	s.SklStatus,
	u.UzId,
	u.UzImie
from
	Sklepy as s
left join UzytkownicySklep as us on
	us.UzSklSklId = s.SklId
	left join Uzytkownicy as u on
	u.UzId = us.UzSklUzId`;
    if (status === "aktywne" && uzytkownikId === "123456789") {
      sql += ` WHERE s.SklStatus = 1 group by s.SklId ORDER BY s.SklStatus DESC, s.SklId`;
    } else if (status === "usuniete" && uzytkownikId === "123456789") {
      sql += ` WHERE s.SklStatus = 0 group by s.SklId ORDER BY s.SklStatus DESC, s.SklId`;
    } else if (uzytkownikId === "123456789") {
      sql += ` group by s.SklId ORDER BY s.SklStatus DESC, s.SklId`;
    } else if (status === "aktywne") {
      sql += ` WHERE s.SklStatus = 1 and us.UzSklUzId = ${connection.escape(
        uzytkownikId
      )} group by s.SklId ORDER BY s.SklStatus DESC, s.SklId`;
    } else if (status === "usuniete") {
      sql += ` WHERE s.SklStatus = 0 and us.UzSklUzId = ${connection.escape(
        uzytkownikId
      )} group by s.SklId ORDER BY s.SklStatus DESC, s.SklId`;
    } else {
      sql += ` WHERE us.UzSklUzId = ${connection.escape(
        uzytkownikId
      )} group by s.SklId ORDER BY s.SklStatus DESC, s.SklId`;
    }

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/sklepy-logowanie", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    let sql = "select * from Sklepy";

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/sklepy-raportowanie/:uzytkownikId", async (req, res) => {
  const uzytkownikId = req.params.uzytkownikId;
  let connection;

  try {
    connection = await dbConfig.getConnection();

    let sql = `
      SELECT DISTINCT s.SklId, s.SklNazwa
      FROM Sklepy AS s
      LEFT JOIN UzytkownicySklep AS us ON us.UzSklSklId = s.SklId
    `;

    if (uzytkownikId !== "123456789") {
      sql += " WHERE us.UzSklUzId = ?";
    }

    const data = await connection.query(
      sql,
      uzytkownikId !== "123456789" ? [uzytkownikId] : []
    );
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).json({ error: "Błąd podczas pobierania danych" });
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/sklepy-dodanie", async (req, res) => {
  const {
    sklepNazwa,
    sklepUlica,
    sklepNumer,
    sklepKod,
    sklepMiejscowosc,
    sklepPojemnosc,
  } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();

    const existingSklep = await connection.query(
      "SELECT SklNazwa FROM Sklepy WHERE SklNazwa = ?",
      [sklepNazwa]
    );

    let errorMessages = [];

    if (existingSklep.some((sklep) => sklep.SklNazwa === sklepNazwa)) {
      errorMessages.push("Podana nazwa sklepu już istnieje.");
    }

    if (errorMessages.length > 0) {
      return res.status(400).json({ error: errorMessages.join(" ") });
    }

    // Wstawienie rekordu do tabeli Sklepy
    const result = await connection.query(
      "INSERT INTO Sklepy (SklNazwa,SklUlica,SklNumer,SklKod,SklMiejscowosc,SklPojemnosc) VALUES (?,?,?,?,?,?)",
      [
        sklepNazwa,
        sklepUlica || "",
        sklepNumer || "",
        sklepKod || "",
        sklepMiejscowosc || "",
        sklepPojemnosc,
      ]
    );

    const sklepId = result.insertId; // Id nowo dodanego sklepu

    // Wstawienie rekordu do tabeli Ulozenie
    await connection.query("INSERT INTO Ulozenie (USklId) VALUES (?)", [
      sklepId,
    ]);

    await connection.query(
      `insert into Liczniki (LSklId, LTyp, LWartosc) values (?,1,100),(?,2,100),(?,3,100)`,
      [sklepId, sklepId, sklepId]
    );

    await connection.query(
      `
      insert into Ceny
        (CTowId,
	      CCena,
	      CPoprzedniaCena,
	      CSklepId)
      values
        (1,6,0,?),
        (2,6,0,?),
        (3,9,0,?),
        (4,8,0,?),
        (5,10,0,?),
        (6,0.5,0,?),
        (7,2,0,?),
        (8,7,0,?)`,
      [sklepId, sklepId, sklepId, sklepId, sklepId, sklepId, sklepId, sklepId]
    );

    logToFile(
      `[INFO] Sklep i przypisanie do Ulozenia dodane pomyślnie: ${sklepNazwa}`
    );
    res
      .status(201)
      .json({ message: "Sklep i przypisanie do Ulozenia dodane pomyślnie." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania sklepu: ${err}`);
    console.log(err);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/sklepy-usuwanie/:id", async (req, res) => {
  const sklepId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Sklepy SET SklStatus = 0, SklDataZmiany = NOW() WHERE SklId = ?",
      [sklepId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Usunięcie sklepu o ID: ${sklepId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/sklepy-przywracanie/:id", async (req, res) => {
  const sklepId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Sklepy SET SklStatus = 1, SklDataZmiany = NOW() WHERE SklId = ?",
      [sklepId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Przywrócenie sklepu o ID: ${sklepId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/kuwety", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    const status = req.query.status || "aktywne";
    const przypisanie = req.query.przypisanie || "nieprzypisane";

    let sql = `
    select
	    k.KuwId,
	    k.KuwSmkId,
	    s.SmkNazwa as KuwSmakNazwa,
	    k.KuwRozId,
	    r.RozPojemnosc as KuwRozmiarIlosc,
	    k.KuwPorcje,
	    k.KuwStatus,
      k.KuwStatusZamowienia,
      sk.SklNazwa as KuwSklNazwa,
      ROUND((k.KuwPorcje / r.RozPojemnosc) * 100, 0) AS KuwProcent
    from
	    Kuwety as k
	  left join Rozmiary as r on r.RozId = k.KuwRozId
	  left join Smaki as s on s.SmkId = k.KuwSmkId
	  left join Sklepy as sk on sk.SklId = k.KuwSklId`;
    if (status === "aktywne") {
      sql +=
        " WHERE k.KuwStatus = 1 AND k.KuwPorcje > 0 ORDER BY k.KuwStatus DESC, k.KuwId";
    } else if (status === "usuniete") {
      sql += " WHERE k.KuwStatus = 0 ORDER BY k.KuwStatus DESC, k.KuwId";
    } else {
      sql += " ORDER BY k.KuwStatus DESC, k.KuwId";
    }

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/kuwety-dodanie", async (req, res) => {
  const { kuwetaSmak, kuwetaRozmiar, kuwetaSklep } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();

    const rows = await connection.query(
      "SELECT RozPojemnosc FROM Rozmiary WHERE RozId = ?",
      [kuwetaRozmiar]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Nie znaleziono rozmiaru." });
    }

    const kuwetaPorcje = rows[0].RozPojemnosc;

    await connection.query(
      "INSERT INTO Kuwety (KuwSmkId, KuwRozId, KuwPorcje, KuwSklId) VALUES (?,?,?,?)",
      [kuwetaSmak, kuwetaRozmiar, kuwetaPorcje, kuwetaSklep || null]
    );

    logToFile(
      `[INFO] Kuweta dodana pomyślnie: Id smak: ${kuwetaSmak} | Id rozmiar: ${kuwetaRozmiar} | Porcje: ${kuwetaPorcje}`
    );
    res.status(201).json({ message: "Kuweta dodana pomyślnie." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania kuwety: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/sklepy-przypisane", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    const status = req.query.status || "aktywne";
    const uzytkownikId = req.query.uzytkownikId;

    let sql = `
      SELECT * FROM Sklepy 
      WHERE SklId NOT IN (
        SELECT UzSklSklId FROM UzytkownicySklep WHERE UzSklUzId = ?
      )`;

    if (status === "aktywne") {
      sql += " AND SklStatus = 1 ORDER BY SklStatus DESC, SklId";
    } else if (status === "usuniete") {
      sql += " AND SklStatus = 0 ORDER BY SklStatus DESC, SklId";
    } else {
      sql += " ORDER BY SklStatus DESC, SklId";
    }

    const data = await connection.query(sql, [uzytkownikId]);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/przypisywanie-uzytkownika", async (req, res) => {
  const { uzytkownikId, sklepyId } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();

    for (const sklepId of sklepyId) {
      await connection.query(
        "INSERT INTO UzytkownicySklep (UzSklUzId, UzSklSklId) VALUES (?, ?)",
        [uzytkownikId, sklepId]
      );
    }

    logToFile(
      `[INFO] Użytkownik ${uzytkownikId} przypisany do sklepów: ${sklepyId.join(
        ", "
      )}`
    );
    res.status(201).json({ message: "Przypisano użytkownika do sklepów." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas przypisywania użytkownika: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

const ENV_FILE = ".env";
const RESTART_SCRIPT = "restart.bat";

app.get("/api/ustawienia", (req, res) => {
  if (!fs.existsSync(ENV_FILE)) return res.json({});
  const envData = dotenv.parse(fs.readFileSync(ENV_FILE));
  res.json(envData);
});

app.post("/api/ustawienia-zapis", (req, res) => {
  const { host, port, user, pass, db } = req.body;
  const envContent = `JWT_SECRET=WUqf6d76cYL@xvYxmpT8*RzV3pQbdt<9<Kmm9vFW5k%oXHD7pSGKd>Th6ozM\nAPP_LOGIN=pinnex\nAPP_HASLO=$2b$10$GyQ.INqS4nPE79RXpWuZTui3O323K9Qxu2drWQ9YU/vdqkk3I0UC6\n\nDB_SERVER=${host}\nDB_PORT=${port}\nDB_USER=${user}\nDB_PASSWORD=${pass}\nDB_DATABASE=${db}\n`;
  fs.writeFileSync(ENV_FILE, envContent);
  exec("pm2 restart server", (error, stdout, stderr) => {
    if (error) {
      logToFile(`[ERROR] Błąd restartu przez PM2: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Błąd restartu serwera przez PM2",
      });
    }

    logToFile("[INFO] Restart serwera przez PM2");
    res.json({
      success: true,
      message: "Zapisano ustawienia i zrestartowano serwer przez PM2",
    });
  });
});

app.post("/api/test-db-connection", (req, res) => {
  const { host, port, user, pass, db } = req.body;

  const connection = mariadb.createConnection({
    host: host,
    port: port,
    user: user,
    password: pass,
    database: db,
  });

  connection
    .then((conn) => {
      logToFile("[INFO] Poprawny test połączenia z bazą danych");
      conn.end();
      return res.json({
        success: true,
        message: "Połączenie z bazą danych udane!",
      });
    })
    .catch((err) => {
      logToFile(`[ERROR] Niepoprawny test połączenia z bazą danych: ${err}`);
      return res.json({
        success: false,
        message: "Błąd połączenia z bazą danych",
      });
    });
});

app.put("/api/ulozenie-kuwet-menu", async (req, res) => {
  const {
    sklepId,
    kuweta1,
    kuweta2,
    kuweta3,
    kuweta4,
    kuweta5,
    kuweta6,
    kuweta7,
    kuweta8,
    kuweta9,
    kuweta10,
  } = req.body;

  let connection;
  let errorMessages = [];

  if (errorMessages.length > 0) {
    return res.status(400).json({ error: errorMessages.join(" ") });
  }

  try {
    connection = await dbConfig.getConnection();

    await connection.query(
      `UPDATE Ulozenie SET 
        UKuw1Id = ?, 
        UKuw2Id = ?, 
        UKuw3Id = ?, 
        UKuw4Id = ?, 
        UKuw5Id = ?, 
        UKuw6Id = ?, 
        UKuw7Id = ?, 
        UKuw8Id = ?, 
        UKuw9Id = ?, 
        UKuw10Id = ?,
        UDataZmiany = now()
      WHERE USklId = ?`,
      [
        kuweta1 || null,
        kuweta2 || null,
        kuweta3 || null,
        kuweta4 || null,
        kuweta5 || null,
        kuweta6 || null,
        kuweta7 || null,
        kuweta8 || null,
        kuweta9 || null,
        kuweta10 || null,
        sklepId,
      ]
    );

    logToFile(
      `[INFO] Ułożenie dodano pomyślnie: SKLEP: ${sklepId} = KUWETA1: ${kuweta1} | KUWETA2: ${kuweta2} | KUWETA3: ${kuweta3} | KUWETA4: ${kuweta4} | KUWETA5: ${kuweta5} | KUWETA6: ${kuweta6} | KUWETA7: ${kuweta7} | KUWETA8: ${kuweta8} | KUWETA9: ${kuweta9} | KUWETA10: ${kuweta10}`
    );

    res.status(201).json({ message: "Ułożenie dodano pomyślnie." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania ułożenia: ${err}`);

    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/ulozenie-kuwet-menu/:sklepId", async (req, res) => {
  const sklepId = req.params.sklepId;
  try {
    const results = await dbConfig.query(
      "SELECT * FROM Ulozenie WHERE USklId = ?",
      [sklepId]
    );
    if (results.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(results);
  } catch (err) {
    logToFile([ERROR]);
    console.log("Błąd przy pobieraniu ułożenia:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/rcp-user-info/:uzytkownikId", async (req, res) => {
  const { uzytkownikId } = req.params;
  let connection;

  try {
    connection = await dbConfig.getConnection();
    const data = await connection.query(
      `select * from RCP where RCPUzId = ${uzytkownikId} order by RCPStartZmiany desc limit 1`
    );
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd sprawdzania otwartej zmiany użytkownika: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  }
});

app.post("/api/zarejestruj-zmiane", async (req, res) => {
  const { uzytkownikId } = req.body;

  if (!uzytkownikId || isNaN(uzytkownikId)) {
    return res.status(400).json({ error: "Nieprawidłowe ID użytkownika" });
  }

  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query("CALL rejestruj_zmiane(?)", [uzytkownikId]);
    res.json({ success: true, message: "Procedura wykonana pomyślnie" });
    logToFile(`[INFO] Zmiana zarejestrowana dla użytkownika: ${uzytkownikId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd rejestracji zmiany: ${err}`);
    res.status(500).json({
      error: "Błąd wykonania procedury",
      details: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/rcp", async (req, res) => {
  let connection;

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Brak wymaganych dat." });
    }

    connection = await dbConfig.getConnection();
    const data = await connection.query(
      `
      SELECT
        RCPId,
        TIME_FORMAT(SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)))), '%H:%i:%s') AS PrzepracowanyCzas,
        SUM(ROUND(
          (HOUR(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) +
           MINUTE(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) / 60), 2)
        ) AS PrzepracowaneGodzinyFormat,
        RCPUzId,
        u.UzId,
        u.UzImie,
        u.UzNazwisko,
        u.UzStawkaGodzinowa
      FROM
        RCP
      LEFT JOIN Uzytkownicy AS u ON u.UzId = RCP.RCPUzId
      WHERE
        u.UzId != 123456789
        AND DATE(RCPKoniecZmiany) BETWEEN ? AND ?
      GROUP BY
        RCPUzId
      `,
      [startDate, endDate]
    );

    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd sprawdzania otwartej zmiany użytkownika: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  }
});

app.get("/api/status-kuwet/:sklepId", async (req, res) => {
  const sklepId = req.params.sklepId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `select
	    k.KuwId,
	    k.KuwSmkId,
	    s.SmkNazwa as KuwSmakNazwa,
	    k.KuwRozId,
      s.SmkKolor,
      s.SmkTekstKolor,
	    r.RozPojemnosc as KuwRozmiarIlosc,
	    k.KuwPorcje,
	    k.KuwStatus,
      k.KuwStatusZamowienia,
      sk.SklNazwa as KuwSklNazwa,
      ROUND((k.KuwPorcje / r.RozPojemnosc) * 100, 0) AS KuwProcent
    from
	    Kuwety as k  
	  left join Rozmiary as r on r.RozId = k.KuwRozId
	  left join Smaki as s on s.SmkId = k.KuwSmkId
	  left join Sklepy as sk on sk.SklId = k.KuwSklId
	  where k.KuwSklId = ?
    order by k.KuwPorcje, s.SmkNazwa
	  `;
    const data = await connection.query(sql, sklepId);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas pobierania danych: ${err}`);
    res.status(500).json({ error: "Błąd pobierania danych" });
  }
});

app.get("/api/rcp-dni/:uzytkownikId", async (req, res) => {
  const { uzytkownikId } = req.params;
  let connection;

  try {
    connection = await dbConfig.getConnection();
    const data = await connection.query(`
      select
	      DATE(RCPStartZmiany) as czasPracy,
	      TIMEDIFF(RCPKoniecZmiany,RCPStartZmiany) as PrzepracowanyCzas,
	      SUM(ROUND(
          (hour(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) +
          minute(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) / 60), 2)
          ) as PrzepracowaneGodzinyFormat,
	      FORMAT(SUM(
          ROUND(
            (hour(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) +
            minute(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) / 60), 2) * 30.50
            ), 2) as Wynagrodzenie,
	        RCPUzId as uzytkownikId
        from
	        RCP
        where RCP.RCPUzId = ${uzytkownikId}
        group by
	        RCPUzId,
	        czasPracy
        order by
	        czasPracy
      `);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd sprawdzania otwartej zmiany użytkownika: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  }
});

function readSQLFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const sqlContent = fs.readFileSync(fullPath, "utf8");

    return sqlContent
      .split(";")
      .map((query) => query.trim())
      .filter((query) => query.length > 0);
  } catch (error) {
    console.error("Błąd odczytu pliku SQL:", error);
    throw error;
  }
}

async function createTables() {
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.beginTransaction();

    const queries = readSQLFile("./SQL/CreateTable.sql");

    for (const query of queries) {
      if (query) {
        await connection.query(query);
      }
    }

    await connection.commit();
    console.log("Wszystkie tabele zostały utworzone");
    return true;
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Błąd podczas tworzenia tabel:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function insertData() {
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.beginTransaction();

    const queries = readSQLFile("./SQL/InsertData.sql");

    for (const query of queries) {
      if (query) {
        await connection.query(query);
      }
    }

    await connection.commit();
    console.log("Wszystkie dane zostały wpisane");
    return true;
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Błąd podczas wpisywaia danych:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

app.post("/api/tworzenie-tabel", async (req, res) => {
  try {
    await createTables();
    res.status(201).json({
      success: true,
      message: "Tabele zostały utworzone na podstawie pliku SQL",
    });
    logToFile("[INFO] Poprawne utworzenie tabel");
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Wystąpił błąd podczas tworzenia tabel",
      details: error.message,
    });
    logToFile(`[ERROR] Błąd tworzenia tabel: ${error}`);
  }
});

app.post("/api/wstawianie-danych", async (req, res) => {
  try {
    await insertData();
    res.status(201).json({
      success: true,
      message: "Dane zostały wpisane na podstawie pliku SQL",
    });
    logToFile("[INFO] Poprawne wpisanie danych");
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Wystąpił błąd podczas wpisywania danych",
      details: error.message,
    });
    logToFile(`[ERROR] Błąd wpisywania danych: ${error}`);
  }
});

async function deleteData() {
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.beginTransaction();

    const queries = readSQLFile("./SQL/TruncateTable.sql");

    for (const query of queries) {
      if (query) {
        await connection.query(query);
      }
    }

    await connection.commit();
    console.log("Dane z tabel zostały usunięte");
    logToFile("[INFO] Dane z tabel zostały usunięte");
    return true;
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Błąd podczas usuwania danych z tabel:", error);
    logToFile(`[ERROR] Błąd podczas usuwania danych z tabel: ${error}`);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

app.post("/api/czyszczenie-tabel", async (req, res) => {
  try {
    await deleteData();
    res.status(201).json({
      success: true,
      message: "Tabele zostały wyczyszczone",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Wystąpił błąd podczas czyszczenia tabel",
      details: error.message,
    });
  }
});

app.post("/api/tworzenie-procedur", async (req, res) => {
  try {
    await createProcedure();
    logToFile("[INFO] Procedura RCP została utworzona przez API");
    res.status(200).json({
      success: true,
      message: "Procedura RCP została pomyślnie utworzona",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logToFile(`[ERROR] Błąd tworzenia procedury: ${error.message}`, "error");

    res.status(500).json({
      success: false,
      message: "Nie udało się utworzyć procedury",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      code: "PROCEDURE_CREATION_FAILED",
    });
  }
});

async function createProcedure() {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    await connection.query("DROP PROCEDURE IF EXISTS rejestruj_zmiane");

    await connection.query(`
    CREATE PROCEDURE rejestruj_zmiane(IN user_id INT)
    BEGIN
        DECLARE v_last_id INT;
        DECLARE v_end_time DATETIME;
        
        SELECT RCPId, RCPKoniecZmiany INTO v_last_id, v_end_time
        FROM RCP 
        WHERE RCPUzId = user_id
        ORDER BY RCPStartZmiany DESC 
        LIMIT 1;
        
        IF v_last_id IS NULL OR v_end_time IS NOT NULL THEN
            INSERT INTO RCP (RCPUzId, RCPStartZmiany, RCPKoniecZmiany)
            VALUES (user_id, NOW(), NULL);
        ELSE
            UPDATE RCP
            SET RCPKoniecZmiany = NOW()
            WHERE RCPId = v_last_id;
        END IF;
    END
    `);
  } finally {
    if (connection) connection.release();
  }
}

app.post("/api/tworzenie-administratora", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query("INSERT INTO Uzytkownicy()");
    res.json({ success: true, message: "Procedura wykonana pomyślnie" });
    logToFile(`[INFO] Zmiana zarejestrowana dla użytkownika: ${uzytkownikId}`);
  } catch (err) {
    logToFile(`[ERROR] Błąd rejestracji zmiany: ${err}`);
    res.status(500).json({
      error: "Błąd wykonania procedury",
      details: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/kuwety-dostepne-centrala", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    let sql = `
    select
	    k.KuwId,
	    k.KuwSmkId,
	    s.SmkNazwa as KuwSmakNazwa,
      s.SmkKolor as SmkKolor,
      s.SmkTekstKolor as SmkTekstKolor,
	    k.KuwRozId,
	    r.RozPojemnosc as KuwRozmiarIlosc,
	    k.KuwPorcje,
	    k.KuwStatus,
      sk.SklNazwa as KuwSklNazwa,
      ROUND((k.KuwPorcje / r.RozPojemnosc) * 100, 0) AS KuwProcent
    from
	    Kuwety as k
	  left join Rozmiary as r on r.RozId = k.KuwRozId
	  left join Smaki as s on s.SmkId = k.KuwSmkId
	  left join Sklepy as sk on sk.SklId = k.KuwSklId
    where sk.SklNazwa is null and k.KuwStatusZamowienia = 1`;

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/smaki-dostepne-centrala", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    let sql = `
    select * from Smaki where SmkStatus = 1`;

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.get(
  "/api/raport-sprzedaz-formy-platnosci/:uzytkownikId",
  async (req, res) => {
    const uzytkownikId = req.params.uzytkownikId;
    const { startDate, endDate } = req.query;
    let connection;

    try {
      connection = await dbConfig.getConnection();

      let sql = `
      SELECT
        d.DokFormaPlatnosci,
        FORMAT(SUM(dp.DokPozCena), 2) AS wartoscSprzedazy
      FROM
        Dokumenty AS d
        LEFT JOIN DokumentyPozycje AS dp ON dp.DokPozDokId = d.DokId
        LEFT JOIN UzytkownicySklep AS us ON us.UzSklSklId = d.DokSklepId
      WHERE 1 = 1
    `;

      const params = [];

      if (uzytkownikId !== "123456789") {
        sql += ` AND us.UzSklUzId = ?`;
        params.push(uzytkownikId);
      }

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      sql += ` GROUP BY d.DokFormaPlatnosci`;

      const data = await connection.query(sql, params);
      res.json(data);
    } catch (err) {
      logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get(
  "/api/raport-sprzedaz-formy-platnosci-sklep/:sklepId",
  async (req, res) => {
    const sklepId = req.params.sklepId;
    const { startDate, endDate } = req.query;
    let connection;

    try {
      connection = await dbConfig.getConnection();

      let sql = `
        SELECT
          d.DokFormaPlatnosci,
          FORMAT(SUM(dp.DokPozCena), 2) AS wartoscSprzedazy
        FROM
          Dokumenty AS d
        LEFT JOIN DokumentyPozycje AS dp ON dp.DokPozDokId = d.DokId
        WHERE d.DokSklepId = ?
      `;

      const params = [sklepId];

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      sql += ` GROUP BY d.DokFormaPlatnosci`;

      const data = await connection.query(sql, params);
      res.json(data);
    } catch (err) {
      logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get(
  "/api/raport-towary-sprzedaz-wartosc/:uzytkownikId",
  async (req, res) => {
    const uzytkownikId = req.params.uzytkownikId;
    const { startDate, endDate } = req.query;
    let connection;

    try {
      connection = await dbConfig.getConnection();

      let sql = `
        SELECT
          t.TowNazwa,
          SUM(DokPozTowIlosc) AS TowaryIlosc,
          SUM(dp.DokPozCena) AS TowaryWartosc
        FROM
          DokumentyPozycje AS dp
          LEFT JOIN Towary AS t ON t.TowId = dp.DokPozPozostalyTowId
          LEFT JOIN Dokumenty AS d ON d.DokId = dp.DokPozDokId
          LEFT JOIN UzytkownicySklep AS us ON us.UzSklSklId = d.DokSklepId
        WHERE
          DokPozTowId IS NULL
          AND t.TowId NOT IN (6, 7)
      `;

      const params = [];

      if (uzytkownikId !== "123456789") {
        sql += ` AND us.UzSklUzId = ?`;
        params.push(uzytkownikId);
      }

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      sql += ` GROUP BY DokPozPozostalyTowId`;

      const data = await connection.query(sql, params);
      res.json(data);
    } catch (err) {
      console.log("Błąd:", err);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get(
  "/api/raport-towary-sprzedaz-wartosc-sklep/:sklepId",
  async (req, res) => {
    const sklepId = req.params.sklepId;
    const { startDate, endDate } = req.query;
    let connection;

    try {
      connection = await dbConfig.getConnection();

      let sql = `
        SELECT
          t.TowNazwa,
          SUM(DokPozTowIlosc) AS TowaryIlosc,
          SUM(dp.DokPozCena) AS TowaryWartosc
        FROM
          DokumentyPozycje AS dp
        LEFT JOIN Towary AS t ON t.TowId = dp.DokPozPozostalyTowId
        LEFT JOIN Dokumenty AS d ON d.DokId = dp.DokPozDokId
        WHERE
          DokPozTowId IS NULL
          AND d.DokSklepId = ?
          AND t.TowId != 6 AND t.TowId != 7
      `;

      const params = [sklepId];

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      sql += ` GROUP BY DokPozPozostalyTowId`;

      const data = await connection.query(sql, params);
      res.json(data);
    } catch (err) {
      console.log("Błąd:", err);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get(
  "/api/raport-sprzedazy-wartosci-dzien/:uzytkownikId",
  async (req, res) => {
    const uzytkownikId = req.params.uzytkownikId;
    const { startDate, endDate } = req.query;
    let connection;

    try {
      connection = await dbConfig.getConnection();

      let sql = `
        SELECT
          FORMAT(SUM(dp.DokPozCena), 2) AS wartoscSprzedazyDzien,
          DATE(d.DokData) AS SprzedazDzien
        FROM
          DokumentyPozycje AS dp
          LEFT JOIN Dokumenty AS d ON d.DokId = dp.DokPozDokId
          LEFT JOIN UzytkownicySklep AS us ON us.UzSklSklId = d.DokSklepId
        WHERE 1=1
          AND dp.DokPozCena IS NOT NULL
      `;

      const params = [];

      if (uzytkownikId !== "123456789") {
        sql += ` AND us.UzSklUzId = ?`;
        params.push(uzytkownikId);
      }

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      sql += ` GROUP BY DATE(d.DokData) ORDER BY SprzedazDzien`;

      const data = await connection.query(sql, params);
      res.json(data);
    } catch (err) {
      logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get(
  "/api/raport-sprzedazy-wartosci-dzien-sklep/:sklepId",
  async (req, res) => {
    let sklepId = req.params.sklepId;
    const { startDate, endDate } = req.query;
    let connection;
    try {
      connection = await dbConfig.getConnection();

      let sql = `
        SELECT
          FORMAT(SUM(dp.DokPozCena), 2) AS wartoscSprzedazyDzien,
          DATE(d.DokData) AS SprzedazDzien
        FROM
          DokumentyPozycje AS dp
        LEFT JOIN Dokumenty AS d ON d.DokId = dp.DokPozDokId
        WHERE
          d.DokSklepId = ?
      `;

      const params = [sklepId];

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      } else {
        sql += ` AND DATE(d.DokData) >= NOW() - INTERVAL 7 DAY`;
      }

      sql += ` GROUP BY DATE(d.DokData), d.DokSklepId`;

      const data = await connection.query(sql, params);
      res.json(data);
    } catch (err) {
      logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get(
  "/api/raport-sprzedazy-ilosci-smaki/:uzytkownikId",
  async (req, res) => {
    const uzytkownikId = req.params.uzytkownikId;
    const { startDate, endDate } = req.query;
    let connection;

    try {
      connection = await dbConfig.getConnection();

      let sql = `
        SELECT
          s.SmkNazwa,
          SUM(dp.DokPozTowIlosc) AS iloscSprzedana,
          s.SmkKolor,
          s.SmkTekstKolor
        FROM
          DokumentyPozycje AS dp
          LEFT JOIN Kuwety AS k ON k.KuwId = dp.DokPozTowId
          LEFT JOIN Smaki AS s ON s.SmkId = k.KuwSmkId
          LEFT JOIN Dokumenty AS d ON d.DokId = dp.DokPozDokId 
          LEFT JOIN Sklepy AS sk ON sk.SklId = d.DokSklepId
          LEFT JOIN UzytkownicySklep AS us ON us.UzSklSklId = d.DokSklepId
        WHERE dp.DokPozTowId IS NOT NULL
      `;

      const params = [];

      if (uzytkownikId !== "123456789") {
        sql += ` AND us.UzSklUzId = ?`;
        params.push(uzytkownikId);
      }

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      sql += `
        GROUP BY s.SmkId
        ORDER BY s.SmkNazwa
      `;

      const data = await dbConfig.query(sql, params);
      res.json(data);
    } catch (err) {
      logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get(
  "/api/raport-sprzedazy-ilosci-smaki-sklep/:sklepId",
  async (req, res) => {
    let sklepId = req.params.sklepId;
    const { startDate, endDate } = req.query;
    let connection;
    try {
      connection = await dbConfig.getConnection();
      let sql = `
        SELECT
          s.SmkNazwa,
          SUM(dp.DokPozTowIlosc) AS iloscSprzedana,
          s.SmkKolor,
          s.SmkTekstKolor
        FROM
          DokumentyPozycje AS dp
        LEFT JOIN Kuwety AS k ON k.KuwId = dp.DokPozTowId
        LEFT JOIN Smaki AS s ON s.SmkId = k.KuwSmkId
        LEFT JOIN Dokumenty AS d ON d.DokId = dp.DokPozDokId
        LEFT JOIN Sklepy AS sk ON sk.SklId = d.DokSklepId
        WHERE
          d.DokSklepId = ?
      `;

      const params = [sklepId];

      if (startDate && endDate) {
        sql += ` AND d.DokData BETWEEN ? AND ?`;
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      } else {
        sql += ` AND d.DokData >= NOW() - INTERVAL 7 DAY`;
      }

      sql += `
        AND dp.DokPozTowId IS NOT NULL
        GROUP BY
          s.SmkId, d.DokSklepId
        ORDER BY
          s.SmkNazwa
      `;

      const data = await dbConfig.query(sql, params);
      res.json(data);
    } catch (err) {
      logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
      res.status(500).send("Błąd podczas pobierania danych");
    } finally {
      if (connection) connection.release();
    }
  }
);

app.get("/api/raport-sprzedazy-towarow/:sklepId", async (req, res) => {
  let sklepId = req.params.sklepId;
  const { startDate, endDate } = req.query;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `
      SELECT
        t.TowNazwa,
        SUM(dp.DokPozTowIlosc) AS iloscSprzedana
      FROM
        DokumentyPozycje AS dp
      LEFT JOIN Towary AS t ON
        t.TowId = dp.DokPozPozostalyTowId
      LEFT JOIN Dokumenty AS d ON
        d.DokId = dp.DokPozDokId
      WHERE
        d.DokSklepId = ?
    `;
    const params = [sklepId];

    if (startDate && endDate) {
      sql += ` AND d.DokData BETWEEN ? AND ?`;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    } else {
      sql += ` AND d.DokData >= NOW() - INTERVAL 7 DAY`;
    }

    sql += `
      GROUP BY
        dp.DokPozPozostalyTowId,
        d.DokSklepId
      ORDER BY
        t.TowNazwa
    `;

    const data = await connection.query(sql, params);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
    res.status(500).json({ error: "Błąd podczas pobierania danych" });
  } finally {
    if (connection) connection.release();
  }
});

const getRozmiary = async (connection) => {
  const rozmiary = await connection.query(
    "SELECT RozId, RozNazwa FROM Rozmiary"
  );

  // Jeśli wynik jest obiektem, sprawdź czy zwrócił jedną tabelę
  if (!Array.isArray(rozmiary)) {
    console.log("rozmiary nie są tablicą, ale obiektem:", rozmiary);
    // Możesz również spróbować wypisać rozmiary w inny sposób:
    rozmiary = [rozmiary]; // Wymusza traktowanie jako tablica
  }

  return rozmiary;
};

app.get("/api/raport-przydzielonych-kuwet/:uzytkownikId", async (req, res) => {
  const uzytkownikId = req.params.uzytkownikId;
  const { startDate, endDate } = req.query;
  let connection;

  try {
    connection = await dbConfig.getConnection();

    const rozmiary = await getRozmiary(connection);

    const countConditions = rozmiary.map((rozmiar) => {
      return `COUNT(CASE WHEN k.KuwRozId = ${rozmiar.RozId} THEN 1 END) AS '${rozmiar.RozNazwa}'`;
    });

    const params = [];

    let sql = `
      SELECT
        ${countConditions.join(", ")} ,
        COUNT(*) AS Wszystkie
      FROM
      (
        SELECT DISTINCT k.*
        FROM Kuwety AS k
        LEFT JOIN UzytkownicySklep AS us ON us.UzSklSklId = k.KuwSklId
        LEFT JOIN Rozmiary AS r ON r.RozId = k.KuwRozId
        WHERE 1=1
    `;

    if (startDate && endDate) {
      sql += ` AND k.KuwDataZmiany BETWEEN ? AND ?`;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    if (uzytkownikId !== "123456789") {
      sql += ` AND us.UzSklUzId = ?`;
      params.push(uzytkownikId);
    }

    sql += ` AND k.KuwSklId IS NOT NULL) AS k`;

    const rows = await connection.query(sql, params);

    const converted = rows.map((row) => {
      const obj = {};
      for (const key in row) {
        obj[key] = typeof row[key] === "bigint" ? Number(row[key]) : row[key];
      }
      return obj;
    });

    res.json(converted);
  } catch (err) {
    console.log(err);
    logToFile(`[ERROR] Błąd podczas raportowania przydzielonych kuwet`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

async function generujNumerDokumentu(sklepId) {
  const rok = new Date().getFullYear();

  try {
    const result = await dbConfig.query(
      "SELECT DokNumOstatniNr FROM DokumentyNumeracja WHERE DokNumSklepId = ? AND DokNumRok = ? and DokNumTyp = 1",
      [sklepId, rok]
    );

    let nowyNumer;

    if (!result || result.length === 0) {
      await dbConfig.query(
        "INSERT INTO DokumentyNumeracja (DokNumSklepId, DokNumRok, DokNumOstatniNr, DokNumTyp) VALUES (?, ?, ?, 1)",
        [sklepId, rok, 1]
      );
      nowyNumer = 1;
    } else {
      nowyNumer = result[0].DokNumOstatniNr + 1;

      await dbConfig.query(
        "UPDATE DokumentyNumeracja SET DokNumOstatniNr = ? WHERE DokNumSklepId = ? AND DokNumRok = ? AND DokNumTyp = 1",
        [nowyNumer, sklepId, rok]
      );
    }

    return `WZ/${nowyNumer}/${rok}/${sklepId}`;
  } catch (error) {
    console.error("Błąd w generujNumerDokumentu:", error);
    return null;
  }
}

app.post("/api/zapisz-wydanie", async (req, res) => {
  try {
    const { sklepId, platnosc, autorId, pozycje } = req.body;

    if (!sklepId || !platnosc || !autorId || !Array.isArray(pozycje)) {
      return res
        .status(400)
        .json({ error: "Brak wymaganych danych wejściowych." });
    }

    const numerDokumentu = await generujNumerDokumentu(sklepId);

    // Zapisanie nagłówka dokumentu
    const result = await dbConfig.query(
      "INSERT INTO Dokumenty (DokNr, DokSklepId, DokFormaPlatnosci, DokAutorId, DokTyp) VALUES (?, ?, ?, ?, 1)",
      [numerDokumentu, sklepId, platnosc, autorId]
    );

    const dokumentId = result.insertId;
    const zmianyLicznikow = {}; // typ => suma zużycia

    for (const pozycja of pozycje) {
      const { towId, pozostalyTowarId, ilosc, cena, typ, rozmiar } = pozycja;

      if (!ilosc || !cena || (!towId && !pozostalyTowarId)) {
        console.warn("Niekompletna pozycja, pominięto:", pozycja);
        continue;
      }

      let procentZuzycia = 1;
      let zuzycie = 0;

      // Tylko lody włoskie (typ 1) aktualizują licznik
      if (typ === 1) {
        if (rozmiar === "mala") procentZuzycia = 100 / 52;
        else if (rozmiar === "duza") procentZuzycia = 100 / 35;
        else console.warn("Nieznany rozmiar porcji lodów włoskich:", rozmiar);

        zuzycie = Math.round(ilosc * procentZuzycia);
      }

      // Zapis pozycji
      await dbConfig.query(
        `INSERT INTO DokumentyPozycje 
          (DokPozDokId, DokPozTowId, DokPozPozostalyTowId, DokPozTowIlosc, DokPozCena) 
         VALUES (?, ?, ?, ?, ?)`,
        [dokumentId, towId || null, pozostalyTowarId || null, ilosc, cena]
      );

      // Aktualizacja stanu kuwet, jeśli dotyczy
      if (towId) {
        await dbConfig.query(
          "UPDATE Kuwety SET KuwPorcje = KuwPorcje - ? WHERE KuwId = ?",
          [ilosc, towId]
        );
      }

      // Aktualizacja liczników tylko dla lodów włoskich
      if (typ === 1) {
        if (!zmianyLicznikow[typ]) zmianyLicznikow[typ] = 0;
        zmianyLicznikow[typ] += zuzycie;
      }
    }

    // Aktualizacja liczników (tylko typy z zużyciem)
    for (const [typ, zmiana] of Object.entries(zmianyLicznikow)) {
      await dbConfig.query(
        `INSERT INTO Liczniki (LSklId, LTyp, LWartosc)
         VALUES (?, ?, GREATEST(0, 100 - ?))
         ON DUPLICATE KEY UPDATE
           LWartosc = GREATEST(0, LWartosc - ?)`,
        [sklepId, typ, zmiana, zmiana]
      );
    }

    res.status(200).json({ message: "Wydanie zapisane", numerDokumentu });
  } catch (err) {
    console.error("Błąd zapisu dokumentu:", err);
    logToFile(`[ERROR] Błąd zapisu wydania: ${err.message}`);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// Endpoint do odczytywania liczników
app.get("/api/odczytaj-licznik", async (req, res) => {
  const { sklepId, typ } = req.query;

  if (!sklepId || !typ) {
    return res
      .status(400)
      .json({ error: "Brak wymaganych parametrów: sklepId i typ" });
  }

  try {
    // Zapytanie do bazy danych, aby odczytać licznik
    const result = await dbConfig.query(
      "SELECT LWartosc FROM Liczniki WHERE LSklId = ? AND LTyp = ?",
      [sklepId, typ]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Licznik nie znaleziony" });
    }

    // Zwracamy wartość licznika
    res.status(200).json({ LWartosc: result[0].LWartosc });
  } catch (err) {
    console.error("Błąd odczytu licznika:", err);
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/odczytaj-licznik", async (req, res) => {
  const { sklepId, typ } = req.query;

  if (!sklepId || !typ) {
    return res
      .status(400)
      .json({ error: "Brak wymaganych parametrów: sklepId i typ" });
  }

  try {
    const result = await dbConfig.query(
      "SELECT LWartosc FROM Liczniki WHERE LSklId = ? AND LTyp = ?",
      [sklepId, typ]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Licznik nie znaleziony" });
    }

    // Zwracamy wartość licznika
    res.status(200).json({ LWartosc: result[0].LWartosc });
  } catch (err) {
    console.error("Błąd odczytu licznika:", err);
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/rcp-uzytkownik/:uzytkownikId", async (req, res) => {
  const { uzytkownikId } = req.params;
  const { startDate, endDate } = req.query; // Pobranie daty z query
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `
      SELECT
        DATE(RCPStartZmiany) AS data,
        SEC_TO_TIME(SUM(TIMESTAMPDIFF(second, RCPStartZmiany, RCPKoniecZmiany))) AS RoznicaCzasu,
        RCPUzId,
        u.UzImie,
        u.UzNazwisko
      FROM
        RCP
      LEFT JOIN Uzytkownicy AS u ON u.UzId = RCP.RCPUzId
      WHERE
        RCPKoniecZmiany IS NOT NULL
        AND RCPUzId = ?
    `;
    const params = [uzytkownikId];

    if (startDate && endDate) {
      sql += ` AND RCPStartZmiany BETWEEN ? AND ?`;
      params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }

    sql += `
      GROUP BY
        DATE(RCPStartZmiany),
        RCPUzId
      ORDER BY
        data DESC
    `;

    const data = await connection.query(sql, params);

    data.forEach((item) => {
      const date = new Date(item.data);
      item.data = date.toLocaleDateString("pl-PL");
    });

    res.json(data);
  } catch (err) {
    console.error(
      `[ERROR] Błąd sprawdzania otwartej zmiany użytkownika: ${err}`
    );
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/ceny/:sklepId", async (req, res) => {
  const sklepId = req.params.sklepId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `select * from Towary as t left join Ceny as c on c.CTowId = t.TowId where CSklepId = ?`;
    const data = await connection.query(sql, sklepId);

    data.forEach((item) => {
      const date = new Date(item.CDataZmiany);
      item.CDataZmiany = date.toLocaleString("pl-PL");
    });

    res.json(data);
  } catch (err) {
    res.status(500);
    logToFile[`Błąd połączenia z bazą danych: ${err}`];
  }
});

app.get("/api/cena-towaru/:towarId/:sklepId", async (req, res) => {
  const towarId = req.params.towarId;
  const sklepId = req.params.sklepId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `select * from Towary as t left join Ceny as c on c.CTowId = t.TowId WHERE t.TowId = ? and c.CSklepId = ?`;
    const data = await connection.query(sql, [towarId, sklepId]);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/ceny-edycja/:towarId/:sklepId", async (req, res) => {
  const towarId = req.params.towarId;
  const sklepId = req.params.sklepId;
  const { cena } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `UPDATE Ceny SET CPoprzedniaCena = CCena, CCena = ?, CDataZmiany = now() WHERE CTowId = ? and CSklepId = ?`;
    const data = connection.query(sql, [cena, towarId, sklepId]);
    res.json(data).status(200);
  } catch (err) {
    console.log(err);
    res.status(500);
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  }
});

app.get("/api/smaki-edycja/:smakId", async (req, res) => {
  const smakId = req.params.smakId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `SELECT * FROM Smaki WHERE SmkId = ?`;
    const data = await dbConfig.query(sql, smakId);
    res.json(data);
    logToFile(`[INFO] Odczytano smakId: ${smakId} `);
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas pobierania danych" });
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/rozmiary-edycja/:rozmiarId", async (req, res) => {
  const rozmiarId = req.params.rozmiarId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `SELECT * FROM Rozmiary WHERE RozId = ?`;
    const data = await connection.query(sql, rozmiarId);
    res.json(data).status(200);
    logToFile(`[INFO] Odczytano rozmiarId: ${rozmiarId}`);
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas pobierania danych" });
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  }
});

app.get("/api/kuwety-edycja/:kuwetaId", async (req, res) => {
  const kuwetaId = req.params.kuwetaId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `SELECT * FROM Kuwety WHERE KuwId = ?`;
    const data = await connection.query(sql, kuwetaId);
    res.json(data).status(200);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
    res.status(500).json({ error: "Błąd podczas pobierania danych" });
  }
});

app.get("/api/uzytkownik-edycja/:uzytkownikId", async (req, res) => {
  const uzytkownikId = req.params.uzytkownikId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = "SELECT * FROM Uzytkownicy WHERE UzId = ?";
    const data = await connection.query(sql, uzytkownikId);
    res.json(data).status(200);
  } catch (err) {
    res.status(500);
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  }
});

app.get("/api/sklepy-edycja/:sklepId", async (req, res) => {
  const sklepId = req.params.sklepId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `SELECT * FROM Sklepy WHERE SklId = ?`;
    const data = await connection.query(sql, sklepId);
    res.json(data).status(200);
  } catch (err) {
    res.status(500);
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  }
});

app.put("/api/smaki-edycja-zapis/:smakId", async (req, res) => {
  const smakId = req.params.smakId;
  const { smak, kolor, textColor } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `UPDATE Smaki SET SmkNazwa = ?, SmkKolor = ?, SmkTekstKolor = ?, SmkDataZmiany = now() WHERE SmkId = ?`;
    const data = await dbConfig.query(sql, [smak, kolor, textColor, smakId]);

    if (Array.isArray(data)) {
      const convertedData = data.map((row) => {
        const obj = {};
        for (const key in row) {
          obj[key] =
            typeof row[key] === "bigint" ? row[key].toString() : row[key];
        }
        return obj;
      });
      res.json(convertedData);
    } else {
      for (const key in data) {
        if (typeof data[key] === "bigint") {
          data[key] = data[key].toString();
        }
      }
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas pobierania danych" });
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  }
});

app.put("/api/rozmiary-edycja-zapis/:rozmiarId", async (req, res) => {
  const rozmiarId = req.params.rozmiarId;
  const { rozmiar, pojemnosc } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `UPDATE Rozmiary SET RozNazwa = ?,RozPojemnosc = ?, RozDataZmiany = now() WHERE RozId = ?`;
    const data = await dbConfig.query(sql, [rozmiar, pojemnosc, rozmiarId]);

    if (Array.isArray(data)) {
      const convertedData = data.map((row) => {
        const obj = {};
        for (const key in row) {
          obj[key] =
            typeof row[key] === "bigint" ? row[key].toString() : row[key];
        }
        return obj;
      });
      res.json(convertedData);
    } else {
      for (const key in data) {
        if (typeof data[key] === "bigint") {
          data[key] = data[key].toString();
        }
      }
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: `Błąd podczas pobierania danych: ${err}` });
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/kuwety-edycja-zapis/:kuwetaId", async (req, res) => {
  const kuwetaId = req.params.kuwetaId;
  const { smak, rozmiar, sklep } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `UPDATE Kuwety SET KuwSmkId = ?,KuwRozId = ?, KuwSklId = ?, KuwDataZmiany = now() WHERE KuwId = ?`;
    const data = connection.query(sql, [
      smak,
      rozmiar,
      sklep || null,
      kuwetaId,
    ]);

    if (Array.isArray(data)) {
      const convertedData = data.map((row) => {
        const obj = {};
        for (const key in row) {
          obj[key] =
            typeof row[key] === "bigint" ? row[key].toString() : row[key];
        }
        return obj;
      });
      res.json(convertedData);
    } else {
      for (const key in data) {
        if (typeof data[key] === "bigint") {
          data[key] = data[key].toString();
        }
      }
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: `Błąd podczas pobiernaia danych: ${err}` });
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/sklepy-edycja-zapis/:sklepId", async (req, res) => {
  const sklepId = req.params.sklepId;
  const { nazwa, ulica, numer, kod, miejscowosc, pojemnosc } = req.body;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `UPDATE Sklepy SET SklNazwa = ?, SklUlica = ?, SklNumer = ?, SklKod = ?, SklMiejscowosc = ?, SklPojemnosc = ?, SklDataZmiany = now() WHERE SklId = ?`;
    const data = connection.query(sql, [
      nazwa,
      ulica,
      numer,
      kod,
      miejscowosc,
      pojemnosc,
      sklepId,
    ]);
    res.json(data);
    logToFile(
      `[INFO] Edycja sklepu o ID: ${sklepId} - Nazwa: ${nazwa} || Ulica: ${ulica} || Numer: ${numer} || Kod: ${kod} || Miejscowość: ${miejscowosc} || Pojemność: ${pojemnosc}`
    );
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  }
});

app.put("/api/uzytkownicy-edycja-zapis/:uzytkownikId", async (req, res) => {
  const uzytkownikId = req.params.uzytkownikId;
  const { imie, nazwisko, login, haslo, pin, stawka } = req.body;
  const hashedHaslo = haslo ? await bcrypt.hash(haslo, 10) : null;
  const hashedPin = pin ? await bcrypt.hash(pin, 10) : null;

  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql;
    let data;

    if (haslo === "" && pin === "" && stawka === "") {
      sql =
        "UPDATE Uzytkownicy SET UzImie = ?,UzNazwisko = ?,UzLogin = ?, UzDataZmiany = now() WHERE UzId = ?";
      data = connection.query(sql, [imie, nazwisko, login, uzytkownikId]);
    } else if (haslo === "" && pin === "") {
      sql =
        "UPDATE Uzytkownicy SET UzImie = ?,UzNazwisko = ?,UzLogin = ?,UzStawkaGodzinowa = ?, UzDataZmiany = now() WHERE UzId = ?";
      data = connection.query(sql, [
        imie,
        nazwisko,
        login,
        stawka,
        uzytkownikId,
      ]);
    } else if (haslo === "" && stawka === "") {
      sql =
        "UPDATE Uzytkownicy SET UzImie = ?, UzNazwisko = ?, UzLogin = ?, UzPIN = ?, UzStawkaGodzinowa = ?, UzDataZmiany = now() WHERE UzId = ?";
      data = connection.query(sql, [
        imie,
        nazwisko,
        login,
        hashedPin,
        stawka,
        uzytkownikId,
      ]);
    } else if (haslo === "") {
      sql =
        "UPDATE Uzytkownicy SET UzImie = ?, UzNazwisko = ?, UzLogin = ?, UzPIN = ?, UzStawkaGodzinowa = ?, UzDataZmiany = now() WHERE UzId = ?";
      data = connection.query(sql, [
        imie,
        nazwisko,
        login,
        hashedPin,
        stawka,
        uzytkownikId,
      ]);
    } else if (pin === "" && stawka === "") {
      sql =
        "UPDATE Uzytkownicy SET UzImie = ?, UzNazwisko = ?, UzLogin = ?, UzHaslo = ?, UzDataZmiany = now() WHERE UzId = ?";
      data = connection.query(sql, [
        imie,
        nazwisko,
        login,
        hashedHaslo,
        uzytkownikId,
      ]);
    } else if (pin === "") {
      sql =
        "UPDATE Uzytkownicy SET UzImie = ?, UzNazwisko = ?, UzLogin = ?, UzHaslo = ?, UzStawkaGodzinowa = ?, UzDataZmiany = now() WHERE UzId = ?";
      data = connection.query(sql, [
        imie,
        nazwisko,
        login,
        hashedHaslo,
        stawka,
        uzytkownikId,
      ]);
    } else {
      sql =
        "UPDATE Uzytkownicy SET UzImie = ?, UzNazwisko = ?, UzLogin = ?, UzHaslo = ?, UzPIN = ?, UzStawkaGodzinowa = ?, UzDataZmiany = now() WHERE UzId = ?";
      data = connection.query(sql, [
        imie,
        nazwisko,
        login,
        hashedHaslo,
        hashedPin,
        stawka,
        uzytkownikId,
      ]);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: `Błąd podczas pobierania danych: ${err}` });
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
  }
});

app.get("/api/haslo", async (req, res) => {
  try {
    res.json({ haslo: process.env.HASLO_USTAWIENIA });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/kuwety-zbiorczo", async (req, res) => {
  const { kuwetki } = req.body;

  if (!Array.isArray(kuwetki) || kuwetki.length === 0) {
    return res.status(400).json({ error: "Brak danych do dodania." });
  }

  let connection;
  try {
    connection = await dbConfig.getConnection();

    for (const kuweta of kuwetki) {
      const { smak, rozmiar, ilosc } = kuweta;

      const rows = await connection.query(
        "SELECT RozPojemnosc FROM Rozmiary WHERE RozId = ?",
        [rozmiar]
      );

      if (rows.length === 0) {
        continue;
      }

      const porcje = rows[0].RozPojemnosc;

      for (let i = 0; i < ilosc; i++) {
        await connection.query(
          "INSERT INTO Kuwety (KuwSmkId, KuwRozId, KuwPorcje) VALUES (?, ?, ?)",
          [smak, rozmiar, porcje]
        );
      }

      logToFile(
        `[INFO] Zbiorczo dodano ${ilosc} kuwet - Smak: ${smak}, Rozmiar: ${rozmiar}`
      );
    }

    res.status(201).json({ message: "Zbiorczo dodano kuwetki." });
  } catch (err) {
    logToFile(`[ERROR] Błąd przy zbiorczym dodawaniu kuwet: ${err}`);
    res.status(500).json({ error: "Błąd serwera." });
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/przydziel-kuwety", async (req, res) => {
  const { sklepId, przydzielenia } = req.body;

  try {
    for (const przydzielenie of przydzielenia) {
      const { smakId, ilosc } = przydzielenie;

      const query = `
        SELECT KuwId, KuwSmkId, KuwSklId
        FROM Kuwety
        WHERE KuwSmkId = ? AND KuwSklId IS NULL
        LIMIT ?
      `;

      const results = await dbConfig.query(query, [smakId, ilosc]);

      if (results.length < ilosc) {
        console.log(
          `Brakuje kuwet: ${ilosc - results.length}, dostępne: ${
            results.length
          }, żądane: ${ilosc}`
        );
        return res.status(400).send("Brakuje kuwet");
      }

      for (let i = 0; i < ilosc; i++) {
        const kuweta = results[i];

        const updateQuery = `
          UPDATE Kuwety
          SET KuwSklId = ?, KuwDataZmiany = now()
          WHERE KuwId = ?
        `;

        await dbConfig.query(updateQuery, [sklepId, kuweta.KuwId]);
      }
    }

    res.status(200).send("Kuwety przypisane!");
  } catch (err) {
    console.error("Błąd przy przetwarzaniu żądania:", err);
    res.status(500).send("Wystąpił błąd przy przydzielaniu kuwet");
  }
});

app.put("/api/zmiana-formy-platnosci", async (req, res) => {
  const { sklepId, platnosc } = req.body;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `
      UPDATE Dokumenty
        SET DokFormaPlatnosci = ?, DokDataZmiany = now()
      WHERE DokId = (
        SELECT DokId
        FROM Dokumenty
        WHERE DokSklepId = ?
        ORDER BY DokData DESC
        LIMIT 1
      );
    `;
    await connection.query(sql, [platnosc, sklepId]);
    res.status(200).json({ message: "Forma płatności zmieniona" });
    logToFile(`[INFO] Zmieniono formę płatności na ${platnosc}`);
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas zmiany formy płatności" });
    logToFile(`[ERROR] Błąd podczas połączenia z bazą danych: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/dostepne-smaki-ilosc", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();
    const sql = `select
	s.SmkId,
	s.SmkNazwa as Nazwa,
	s.SmkKolor,
	s.SmkTekstKolor,
	COUNT(case when k.KuwId is not null and k.KuwSklId is null then 1 end) as Dostepne_w_Centrali
from
	Smaki as s
left join Kuwety as k on
	k.KuwSmkId = s.SmkId
group by
	s.SmkId,
	s.SmkNazwa
order by
	s.SmkNazwa;`;
    const rows = await connection.query(sql);

    const converted = rows.map((row) => {
      const obj = {};
      for (const key in row) {
        obj[key] = typeof row[key] === "bigint" ? Number(row[key]) : row[key];
      }
      return obj;
    });

    res.json(converted);
  } catch (err) {
    res.status(500).json({
      error: `Błąd pobierania dostępnych smaków i ich ilości: ${err}`,
    });
  } finally {
    if (connection) connection.release();
  }
});

async function generujNumerZamowienia(sklepId) {
  const rok = new Date().getFullYear();

  try {
    const result = await dbConfig.query(
      "SELECT DokNumOstatniNr FROM DokumentyNumeracja WHERE DokNumSklepId = ? AND DokNumRok = ? AND DokNumTyp = 2",
      [sklepId, rok]
    );

    let nowyNumer;

    if (!result || result.length === 0) {
      await dbConfig.query(
        "INSERT INTO DokumentyNumeracja (DokNumSklepId, DokNumRok, DokNumOstatniNr, DokNumTyp) VALUES (?, ?, ?, 2)",
        [sklepId, rok, 1]
      );
      nowyNumer = 1;
    } else {
      nowyNumer = result[0].DokNumOstatniNr + 1;

      await dbConfig.query(
        "UPDATE DokumentyNumeracja SET DokNumOstatniNr = ? WHERE DokNumSklepId = ? AND DokNumRok = ? AND DokNumTyp = 2",
        [nowyNumer, sklepId, rok]
      );
    }

    return `ZAM/${nowyNumer}/${rok}/${sklepId}`;
  } catch (error) {
    console.error("Błąd w generujNumerZamowienia:", error);
    return null;
  }
}

app.post("/api/zamowienie", async (req, res) => {
  const zamowienia = req.body.zamowienia;
  const uzytkownik = req.body.uzytkownik;
  const sklep = req.body.sklep;

  if (!Array.isArray(zamowienia)) {
    return res.status(400).send("Zamówienia muszą być tablicą.");
  }

  let connection;

  try {
    connection = await dbConfig.getConnection();
    await connection.beginTransaction();

    const numerZamowienia = await generujNumerZamowienia(sklep);

    const zamowienieWynik = await connection.query(
      `INSERT INTO Zamowienia 
        (ZamNr, ZamAutorId, ZamSklId, ZamDokTyp) 
       VALUES (?, ?, ?, 2)`,
      [numerZamowienia, uzytkownik, sklep]
    );

    const zamowienieId = zamowienieWynik.insertId;

    for (const zam of zamowienia) {
      const { nazwa, opis, isSmak } = zam;

      await connection.query(
        `INSERT INTO ZamowieniaPozycje (ZamPozZamId, ZamPozTowar, ZamPozOpis, ZamPozIsSmak) 
         VALUES (?, ?, ?, ?)`,
        [zamowienieId, nazwa, opis, isSmak]
      );
    }

    await connection.commit();
    res
      .status(200)
      .json({ message: "Zamówienie zostało zapisane.", numerZamowienia });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Błąd podczas zapisywania zamówienia:", err);
    res.status(500).send("Wystąpił błąd podczas zapisywania zamówienia.");
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/zamowienia-nowe/:uzytkownik", async (req, res) => {
  const uzytkownik = req.params.uzytkownik;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `
      select
	      count(z.ZamId) as liczbaZamowien
      from
	      Zamowienia as z
      left join uzytkownicysklep as us on
	      us.UzSklSklId = z.ZamSklId
      where
	      us.UzSklUzId = ? and z.ZamZrealizowano = 0 and z.ZamStatus = 1
    `;
    const rows = await connection.query(sql, uzytkownik);

    const converted = rows.map((row) => {
      const obj = {};
      for (const key in row) {
        obj[key] = typeof row[key] === "bigint" ? Number(row[key]) : row[key];
      }
      return obj;
    });

    res.json(converted);
  } catch (err) {
    console.log(err);
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/zamowienia-sklepy/:uzytkownik/:status", async (req, res) => {
  const uzytkownik = req.params.uzytkownik;
  const status = req.params.status;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `
      select
        z.ZamId,
	      z.ZamNr,
	      s.SklNazwa,
	      date(z.ZamDataUtworzenia) as Data
      from
	      Zamowienia as z
      left join UzytkownicySklep as us on
	      us.UzSklSklId = z.ZamSklId
      left join Sklepy as s on
	      s.SklId = z.ZamSklId
    `;

    if (status === "niezrealizowane") {
      sql += `
      where
	      us.UzSklUzId = ? and z.ZamStatus = 1 and z.ZamZrealizowano = 0
      group by
	      z.ZamNr`;
    } else if (status === "zrealizowane") {
      sql += `
      where
	      us.UzSklUzId = ? and z.ZamStatus = 1 and z.ZamZrealizowano = 1
      group by
	      z.ZamNr`;
    } else if (status === "aktywne") {
      sql += `
      where
	      us.UzSklUzId = ? and z.ZamStatus = 1
      group by
	      z.ZamNr`;
    } else if (status === "usuniete") {
      sql += `
      where
	      us.UzSklUzId = ? and z.ZamStatus = 0
      group by
	      z.ZamNr`;
    } else {
      sql += `
      where
	      us.UzSklUzId = ?
      group by
	      z.ZamNr`;
    }

    const data = await connection.query(sql, uzytkownik);
    data.forEach((item) => {
      const date = new Date(item.Data);
      item.Data = date.toLocaleDateString("pl-PL");
    });
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z MariaDB: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/zamowienia-szczegoly/:zamowienieId", async (req, res) => {
  const zamowienieId = req.params.zamowienieId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `select * from ZamowieniaPozycje where ZamPozZamId = ?`;
    const data = await connection.query(sql, zamowienieId);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z MariaDB: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/zamowienie-zrealizuj/:zamowienieId", async (req, res) => {
  const zamowienieId = req.params.zamowienieId;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `
      update Zamowienia set ZamZrealizowano = 1 where ZamId = ?
    `;
    await dbConfig.query(sql, zamowienieId);
    res.status(200).send({ success: true });
  } catch (err) {
    logToFile(`[ERROR] Błąd realizacji zamówienia: ${err}`);
  }
});

app.get("/api/odczytaj-licznik-wloskie/:sklepId/:typ", async (req, res) => {
  const sklepId = req.params.sklepId;
  const typ = req.params.typ;
  let connection;

  try {
    connection = await dbConfig.getConnection();
    let sql = `
      select * from Liczniki where LSklId = ? and LTyp = ?
    `;
    const data = await connection.query(sql, [sklepId, typ]);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd pobierania licznika lodów włoskich`);
    console.log(err);
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/resetuj-licznik-wloskie/:sklepId/:typ", async (req, res) => {
  const sklep = req.params.sklepId;
  const typ = req.params.typ;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    let sql = `
      update Liczniki set LWartosc = 100 where LSklId = ? and LTyp = ?
    `;
    await connection.query(sql, [sklep, typ]);
  } catch (err) {
    logToFile(`[ERROR] Błąd resetowania licznika lodów włoskich: ${err}`);
    console.log(err);
  } finally {
    if (connection) connection.release();
  }
});

app.listen(appPort, () => {
  console.log(`Uruchomiono serwer na porcie ${appPort}`);
  logToFile(`[INFO] Uruchomiono serwer na porcie ${appPort}`);
});
