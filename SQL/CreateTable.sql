create table if not exists Uzytkownicy(
	UzId int not null primary key auto_increment,
	UzImie varchar(255) not null,
	UzNazwisko varchar(255) not null,
	UzLogin varchar(255),
	UzHaslo varchar(255),
	UzPIN varchar(255),
	UzStatus boolean not null default 1,
	UzStawkaGodzinowa float default 0.00,
	UzDataZmiany datetime not null default now()
);

create table if not exists Sklepy(
	SklId int not null primary key auto_increment,
	SklNazwa varchar(255) not null,
	SklUlica varchar(255),
	SklNumer varchar(255),
	SklKod varchar(255), 
	SklMiejscowosc varchar(255),
	SklPojemnosc int not null,
	SklDataZmiany datetime not null default now(),
	SklStatus boolean not null default 1
);

create table if not exists UzytkownicySklep (
    UzSklId int not null primary key auto_increment,
    UzSklUzId int not null,
    UzSklSklId int not null
);

create table if not exists Smaki(
	SmkId int not null primary key auto_increment,
	SmkNazwa varchar(255) not null,
	SmkKolor varchar(255),
	SmkTekstKolor varchar(255),
	SmkStatus boolean not null default 1,
	SmkTowId int not null default 1,
	SmkDataZmiany datetime not null default now()
);

create table if not exists RCP(
	RCPId int not null primary key auto_increment,
	RCPStartZmiany datetime,
	RCPKoniecZmiany datetime,
	RCPUzId int not null
);

create table if not exists Rozmiary(
	RozId int not null primary key auto_increment,
	RozNazwa varchar(255) not null,
	RozPojemnosc int not null,
	RozDataZmiany datetime not null default now(),
	RozStatus boolean not null default 1
);

create table if not exists Kuwety(
	KuwId int not null primary key auto_increment,
	KuwSmkId int not null,
	KuwRozId int not null,
	KuwPorcje int not null,
	KuwSklId int,
	KuwStatus boolean not null default 1,
	KuwDataZmiany datetime default now()
);

create table if not exists Ulozenie (
    UId int not null primary key auto_increment,
	UKuw1Id int,
	UKuw2Id int,
	UKuw3Id int,
	UKuw4Id int,
	UKuw5Id int,
	UKuw6Id int,
	UKuw7Id int,
	UKuw8Id int,
	UKuw9Id int,
	UKuw10Id int,
	USklId int not null,
	UDataZmiany datetime not null default now()
);

create table if not exists Towary(
	TowId int not null primary key auto_increment,
	TowNazwa varchar(255) not null,
	TowCenaId int not null,
	TowDataZmiany datetime not null default now()
);

create table if not exists KuwetyStatusZamowienia(
	KuwStatZamId int not null primary key auto_increment,
	KuwStatZamNazwa varchar(255) not null,
	KuwStatZamDataZmiany datetime not null default now()
);

	CREATE TABLE IF NOT EXISTS DokumentyNumeracja (
	DokNumSklepId INT NOT NULL,
	DokNumRok INT NOT NULL,
	DokNumTyp int NOT NULL,
	DokNumOstatniNr INT DEFAULT 0,
	PRIMARY KEY (DokNumSklepId, DokNumRok, DokNumTyp)
	);


create table if not exists DokumentyPozycje(
	DokPozId int not null primary key auto_increment,
	DokPozDokId int not null,
	DokPozTowId int,
	DokPozPozostalyTowId int,
	DokPozTowIlosc float not null,
	DokPozCena float(10,2) not null
);

create table if not exists Dokumenty(
	DokId int not null primary key auto_increment,
	DokNr varchar(25) unique not null,
	DokSklepId int not null,
	DokData datetime not null default now(),
	DokFormaPlatnosci ENUM('gotówka', 'karta', 'bon') not null,
	DokAutorId int not null);

create table if not exists DokumentyTyp (
	DokTypId int not null primary key auto_increment,
	DokTypNazwa varchar(255) not null,
	DokTypSymbol varchar(255) not null
);

create table if not exists Ceny(
	CId int not null primary key auto_increment,
	CTowId int not null,
	CCena float not null,
	CPoprzedniaCena float not null,
	CDataZmiany datetime not null default now()
);

create table if not exists Zamowienia (
	ZamId int not null primary key auto_increment,
	ZamNr varchar(255) not null,
	ZamAutorId int not null,
	ZamSklId int not null,
	ZamDokTyp int not null,
	ZamStatus boolean not null default 1,
	ZamZrealizowano boolean not null default 0,
	ZamDataUtworzenia datetime not null default now(),
	ZamDataZmiany datetime not null default now()
);

create table if not exists ZamowieniaPozycje (
	ZamPozId int not null primary key auto_increment,
	ZamPozZamId int not null,
	ZamPozTowar varchar(255) not null,
	ZamPozOpis varchar(255),
	ZamPozIsSmak boolean not null
);

CREATE TABLE if not exists Liczniki (
  LId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  LSklId INT NOT NULL,
  LTyp INT NOT NULL,
  LWartosc INT NOT NULL,
  LDataUtworzenia DATETIME NOT NULL DEFAULT NOW(),
  LDataZmiany DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uniq_sklep_typ (LSklId, LTyp)
);

create table if not exists Wlewy (
	WlewId int not null primary key auto_increment,
	WlewSklepId int not null,
	WlewTyp int not null,
	WlewData datetime not null default now()
);