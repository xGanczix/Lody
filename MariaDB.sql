## Tworzenie bazy oraz tabel Lody Łącko ##

## Tworzenie bazy danych ##
CREATE DATABASE LodyLacko

## Użytkownicy ##
create table Uzytkownicy(
	UzId int not null primary key auto_increment,
	UzImie varchar(255) not null,
	UzNazwisko varchar(255) not null,
	UzLogin varchar(255),
	UzHaslo varchar(255),
	UzPIN varchar(255),
	UzStatus boolean not null default 1,
	UzStawkaGodzinowa float default 0.00,
	UzDataZmiany datetime not null default now())

## Sklepy ##
create table Sklepy(
	SklId int not null primary key auto_increment,
	SklNazwa varchar(255) not null,
	SklUlica varchar(255),
	SklNumer varchar(255),
	SklKod varchar(255), 
	SklMiejscowosc varchar(255),
	SklPojemnosc int not null,
	SklDataZmiany datetime not null default now(),
	SklStatus boolean not null default 1)

## Połączenie Użytkowników ze sklepami ##
create table UzytkownicySklep (
    UzSklId int not null primary key auto_increment,
    UzSklUzId int not null,
    UzSklSklId int not null)

## Smaki ##
create table Smaki(
	SmkId int not null primary key auto_increment,
	SmkNazwa varchar(255) not null,
	SmkDataZmiany datetime not null default now(),
	SmkKolor varchar(255),
	SmkTekstKolor varchar(255),
	SmkStatus boolean not null default 1)

## ECP ##
create table RCP(
	RCPId int not null primary key auto_increment,
	RCPStartZmiany datetime,
	RCPKoniecZmiany datetime,
	RCPUzId int not null)
		
## Ceny ##
create table Ceny(
	CenId int not null primary key auto_increment,
	CenNazwa varchar(255) not null,
	CenCena float not null,
	CenDataZmiany datetime not null default now())
	
## Rozmiary ##
create table Rozmiary(
	RozId int not null primary key auto_increment,
	RozNazwa varchar(255) not null,
	RozPojemnosc int not null,
	RozDataZmiany datetime not null default now(),
	RozStatus boolean not null default 1)
	
## Magazyny ##
create table Magazyny(
	MagId int not null primary key auto_increment,
	MagNazwa varchar(255) not null,
	MagSklId int not null,
	MagDataZmiany datetime not null default now())

## Typy dokumentów ##
create table TypDokumentow(
	TypDokId int not null primary key auto_increment,
	TypDokNazwa varchar(255) not null,
	TypDokPrefix varchar(5) not null)

## Dokumenty numeracja ##
create table DokumentyNumeracja(
	DokNumId int not null primary key auto_increment,
	DokNumTypDokId int not null,
	DokNumOstatniNumer int not null default 0,
	DokNumSklId int not null,
	DokNumDatazmiany datetime not null default now())

## Dokumenty ##
create table Dokumenty(
	DokId int not null primary key auto_increment,
	DokTypDokId int not null,
	DokNumer varchar(255) not null,
	DokSklId int not null,
	DokData datetime not null default now())
	
## Kuwety ##
create table Kuwety(
	KuwId int not null primary key auto_increment,
	KuwSmkId int not null,
	KuwRozId int not null,
	KuwPorcje int not null,
	KuwSklId int,
	KuwDataZmiany datetime default now(),
	KuwStatus boolean not null default 1)
	
## Towary ##
create table Towary(
	TowId int not null primary key auto_increment,
	TowNazwa varchar(255) not null,
	TowRozId int not null,
	TowDataZmiany datetime not null default now())
	
## Układ kuwet na sklep ##
create table ulozenie (UId int not null primary key auto_increment,
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
	UzDataZmiany datetime not null default now())

## Procedura otwierania i zamykania zmiany (! NIE DZIAŁA NA DBEAVER !) ##
DELIMITER //
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
END//
DELIMITER ;