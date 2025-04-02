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
        sklepId: pinSklep,
        sklepNazwa: sklepNazwa,
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
    const uzytkownikId = req.query.uzytkownik;

    let sql =
      "select s.SklId,s.SklNazwa,s.SklUlica,s.SklNumer,s.SklKod,s.SklMiejscowosc,s.SklPojemnosc, s.SklStatus, u.UzId, u.UzImie from uzytkownicysklep as us left join uzytkownicy as u on u.UzId = us.UzSklUzId left join sklepy as s on s.SklId = us.UzSklSklId";
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

    logToFile(
      `[INFO] Sklep i przypisanie do Ulozenia dodane pomyślnie: ${sklepNazwa}`
    );
    res
      .status(201)
      .json({ message: "Sklep i przypisanie do Ulozenia dodane pomyślnie." });
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
      "SELECT * FROM ulozenie WHERE USklId = ?",
      [sklepId]
    );
    if (results.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(results);
  } catch (err) {
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
      `select * from rcp where RCPUzId = ${uzytkownikId} order by RCPStartZmiany desc limit 1`
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
    connection = await dbConfig.getConnection();
    const data = await connection.query(`
      select
        RCPId,
	      TIME_FORMAT(SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)))), '%H:%i:%s') as PrzepracowanyCzas,
	      SUM(ROUND(
        (hour(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) +
        minute(TIMEDIFF(RCPKoniecZmiany, RCPStartZmiany)) / 60), 2)
        ) as PrzepracowaneGodzinyFormat,
	      RCPUzId,
        u.UzId,
	      u.UzImie,
	      u.UzNazwisko,
	      u.UzStawkaGodzinowa
      from
	      rcp
      left join uzytkownicy as u on
	      u.UzId = rcp.RCPUzId
      group by
	      RCPUzId
      `);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd sprawdzania otwartej zmiany użytkownika: ${err}`);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
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
	        rcp
        where rcp.RCPUzId = ${uzytkownikId}
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

app.post("/api/tworzenie-tabel", async (req, res) => {
  try {
    await createTables();
    res.status(201).json({
      success: true,
      message: "Tabele zostały utworzone na podstawie pliku SQL",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Wystąpił błąd podczas tworzenia tabel",
      details: error.message,
    });
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
        FROM rcp 
        WHERE RCPUzId = user_id
        ORDER BY RCPStartZmiany DESC 
        LIMIT 1;
        
        IF v_last_id IS NULL OR v_end_time IS NOT NULL THEN
            INSERT INTO rcp (RCPUzId, RCPStartZmiany, RCPKoniecZmiany)
            VALUES (user_id, NOW(), NULL);
        ELSE
            UPDATE rcp 
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
    select * from smaki where SmkStatus = 1`;

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z Bazą Danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/raport-sprzedaz-formy-platnosci", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    let sql = `
    SELECT
      d.DokFormaPlatnosci,
      format(SUM(dp.DokPozCena),2) AS wartoscSprzedazy
    FROM
      dokumenty AS d
    LEFT JOIN dokumentypozycje AS dp ON
      dp.DokPozDokId = d.DokId
    GROUP BY
      d.DokFormaPlatnosci;

    `;

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/raport-sprzedazy-wartosci-dzien", async (req, res) => {
  let connection;
  try {
    connection = await dbConfig.getConnection();

    let sql = `
    select
	    format(sum(dp.DokPozCena), 2) as wartoscSprzedazyDzien,
	    date(d.DokData) as SprzedazDzien
    from
	    dokumentypozycje as dp
    left join dokumenty as d on
	    d.DokId = dp.DokPozDokId
	  where date(d.DokData) >= now() - interval 7 day
    group by
	    date(d.DokData)`;

    const data = await connection.query(sql);
    res.json(data);
  } catch (err) {
    logToFile(`[ERROR] Błąd połączenia z bazą danych: ${err}`);
    res.status(500).send("Błąd podczas pobierania danych");
  } finally {
    if (connection) connection.release();
  }
});

app.put("/api/zamowienie-bufor/:kuwetaId", async (req, res) => {
  const kuwetaId = req.params.id;
  let connection;
  try {
    connection = await dbConfig.getConnection();
    await connection.query(
      "UPDATE Kuwety SET KuwStatusZamowienia = 3, KuwDataZmiany = now() WHERE KuwId = ?",
      [kuwetaId]
    );
    res.status(200).json({ message: "Status zmieniony" });
    logToFile(`[INFO] Status kuwety: ${kuwetaId} zmieniony na 0`);
  } catch (err) {
    res.status(500).json({ error: "Błąd serwera" });
    logToFile(`[ERROR] Błąd MariaDB: ${err}`);
  } finally {
    if (connection) connection.release();
  }
});

async function generujNumerDokumentu(sklepId) {
  const rok = new Date().getFullYear();

  try {
    // Pobieramy wynik zapytania, sprawdzamy, co jest zwracane
    const result = await dbConfig.query(
      "SELECT DokNumOstatniNr FROM DokumentyNumeracja WHERE DokNumSklepId = ? AND DokNumRok = ?",
      [sklepId, rok]
    );

    // Sprawdzamy, czy wynik zawiera dane
    let nowyNumer;

    if (!result || result.length === 0) {
      // Jeśli brak wyników, dodajemy nowy rekord z numerem 1
      await dbConfig.query(
        "INSERT INTO DokumentyNumeracja (DokNumSklepId, DokNumRok, DokNumOstatniNr) VALUES (?, ?, ?)",
        [sklepId, rok, 1]
      );
      nowyNumer = 1; // Nowy numer dokumentu
    } else {
      // Jeśli wynik istnieje, zwiększamy numer
      nowyNumer = result[0].DokNumOstatniNr + 1;

      // Aktualizujemy numerację
      await dbConfig.query(
        "UPDATE DokumentyNumeracja SET DokNumOstatniNr = ? WHERE DokNumSklepId = ? AND DokNumRok = ?",
        [nowyNumer, sklepId, rok]
      );
    }

    // Zwracamy numer dokumentu w oczekiwanym formacie
    return `WZ/${nowyNumer}/${rok}/${sklepId}`;
  } catch (error) {
    console.error("Błąd w generujNumerDokumentu:", error);
    return null;
  }
}

// 📌 API do zapisu dokumentu
app.post("/api/zapisz-wydanie", async (req, res) => {
  try {
    const { sklepId, platnosc, autorId, pozycje } = req.body;
    const numerDokumentu = await generujNumerDokumentu(sklepId);

    const result = await dbConfig.query(
      "INSERT INTO Dokumenty (DokNr, DokSklepId, DokFormaPlatnosci, DokAutorId) VALUES (?, ?, ?, ?)",
      [numerDokumentu, sklepId, platnosc, autorId]
    );

    const dokumentId = result.insertId;

    for (const pozycja of pozycje) {
      if (pozycja.towId) {
        await dbConfig.query(
          "INSERT INTO DokumentyPozycje (DokPozDokId, DokPozTowId, DokPozTowIlosc, DokPozCena) VALUES (?, ?, ?, ?)",
          [dokumentId, pozycja.towId, pozycja.ilosc, pozycja.cena]
        );

        // 3️⃣ Aktualizacja ilości w Kuwety
        await dbConfig.query(
          "UPDATE Kuwety SET KuwPorcje = KuwPorcje - ? WHERE KuwId = ?",
          [pozycja.ilosc, pozycja.towId]
        );
      }
    }

    res.status(200).json({ message: "Wydanie zapisane", numerDokumentu });
  } catch (err) {
    console.error("Błąd zapisu dokumentu:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.listen(appPort, () => {
  console.log(`Uruchomiono serwer na porcie ${appPort}`);
  logToFile(`[INFO] Uruchomiono serwer na porcie ${appPort}`);
});
