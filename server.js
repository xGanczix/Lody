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
          { id: 999, login: "pinnex", imie: "Pinnex", nazwisko: "Info" },
          SECRET_KEY,
          { expiresIn: "8h" }
        );
        logToFile("[INFO] Zalogowano Serwis");
        return res.json({ message: "Zalogowano pomyślnie", token });
      }
    }

    connection = await dbConfig.getConnection();
    const rows = await connection.query(
      "SELECT * FROM uzytkownicy WHERE UzLogin = ? AND UzStatus = 1",
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
      "INSERT INTO Uzytkownicy(UzImie, UzNazwisko, UzLogin, UzHaslo, UzPIN) VALUES (?,?,?,?,?)",
      [
        uzytkownikImie,
        uzytkownikNazwisko,
        uzytkownikLogin || "",
        hashedPassword,
        hashedPIN,
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

app.get("/api/smaki-sklep/:sklepId", async (req, res) => {
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
	    k.KuwPorcje as Porcje
    from
	    kuwety as k
    left join rozmiary as r on
	    r.RozId = k.KuwRozId
    left join smaki as s on
	    s.SmkId = k.KuwSmkId
      where k.KuwSklId = ?`;

    const data = await connection.query(sql, [sklepId]);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
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
      "UPDATE Rozmiary SET RozStatus = 1 WHERE RozId = ?",
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

app.get("/api/sklepy", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    const status = req.query.status || "aktywne";

    let sql = "SELECT * FROM Sklepy";
    if (status === "aktywne") {
      sql += " WHERE SklStatus = 1 ORDER BY SklStatus DESC, SklId";
    } else if (status === "usuniete") {
      sql += " WHERE SklStatus = 0 ORDER BY SklStatus DESC, SklId";
    } else {
      sql += " ORDER BY SklStatus DESC, SklId";
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

    await connection.query(
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
    logToFile(`[INFO] Sklep dodany pomyślnie: ${sklepNazwa}`);
    res.status(201).json({ message: "Sklep dodany pomyślnie." });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania sklepu: ${err}`);
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

    let sql = `
    select
	    k.KuwId,
	    k.KuwSmkId,
	    s.SmkNazwa as KuwSmakNazwa,
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
	  left join Sklepy as sk on sk.SklId = k.KuwSklId`;
    if (status === "aktywne") {
      sql += " WHERE k.KuwStatus = 1 ORDER BY k.KuwStatus DESC, k.KuwId";
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
      "SELECT RozPojemnosc FROM rozmiary WHERE RozId = ?",
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
  exec(`start ${RESTART_SCRIPT}`, (error, stdout, stderr) => {
    if (error) {
      logToFile(`[ERROR] Błąd uruchamiania skryptu: ${error}`);
      return res
        .status(500)
        .json({ success: false, message: "Błąd uruchamiania skryptu" });
    }
    logToFile("[INFO] Restart serwera");
    res.json({
      success: true,
      message: "Zapisano ustawienia i uruchomiono restart.bat",
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

app.post("/api/ulozenie-kuwet-menu", async (req, res) => {
  const {
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
    sklepId,
  } = req.body;

  let connection;
  let errorMessages = [];
  if (!sklepId) {
    errorMessages.push("Brak wymaganego pola: sklepId.");
  }
  try {
    connection = await dbConfig.getConnection();

    if (errorMessages.length > 0) {
      return res.status(400).json({ error: errorMessages.join(" ") });
    }

    await connection.query(
      "INSERT INTO Ulozenie (UKuw1Id, UKuw2Id, UKuw3Id, UKuw4Id, UKuw5Id, UKuw6Id, UKuw7Id, UKuw8Id, UKuw9Id, UKuw10Id, USklId) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
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

app.get("/api/ulozenie-kuwet", async (req, res) => {
  try {
    const { sklepId } = req.query;
    if (!sklepId) {
      return res.status(400).json({ error: "Brak wymaganych parametrów." });
    }

    const sql = `SELECT * FROM UlozenieKuwet WHERE SklepId = @sklepId`;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("sklepId", sql.Int, sklepId)
      .query(sql);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "Brak danych dla podanego sklepu." });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Błąd w API /api/ulozenie-kuwet:", error);
    res.status(500).json({ error: "Błąd serwera." });
  }
});

app.listen(appPort, () => {
  console.log(`Uruchomiono serwer na porcie ${appPort}`);
  logToFile(`[INFO] Uruchomiono serwer na porcie ${appPort}`);
});
