-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: lody_lacko
-- ------------------------------------------------------
-- Server version	11.6.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `lody_lacko`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `lody_lacko` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;

USE `lody_lacko`;

--
-- Table structure for table `kuwety`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `kuwety` (
  `KuwId` int(11) NOT NULL AUTO_INCREMENT,
  `KuwSmkId` int(11) NOT NULL,
  `KuwRozId` int(11) NOT NULL,
  `KuwPorcje` int(11) NOT NULL,
  `KuwSklId` int(11) DEFAULT NULL,
  `KuwDataZmiany` datetime DEFAULT current_timestamp(),
  `KuwStatus` tinyint(1) NOT NULL DEFAULT 1,
  `KuwStatusZamowienia` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`KuwId`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kuwety`
--

INSERT INTO `kuwety` (`KuwId`, `KuwSmkId`, `KuwRozId`, `KuwPorcje`, `KuwSklId`, `KuwDataZmiany`, `KuwStatus`, `KuwStatusZamowienia`) VALUES (1,1,1,90,1,'2025-03-31 16:39:18',1,2),(2,2,1,90,1,'2025-03-31 16:39:24',1,2),(3,3,2,75,1,'2025-03-31 16:39:30',1,2),(4,4,2,75,1,'2025-03-31 16:39:36',1,2),(5,5,1,90,1,'2025-03-31 16:39:41',1,2),(6,6,1,90,1,'2025-03-31 16:39:50',1,2),(7,7,2,75,1,'2025-03-31 16:39:56',1,2),(8,8,1,90,1,'2025-03-31 16:40:01',1,2),(9,9,2,75,1,'2025-03-31 16:40:06',1,2),(10,10,1,90,1,'2025-03-31 16:40:11',1,2),(11,11,1,90,1,'2025-03-31 16:40:18',1,2),(12,12,1,90,1,'2025-03-31 16:40:24',1,2),(13,13,2,75,1,'2025-03-31 16:40:30',1,2),(14,14,2,75,1,'2025-03-31 16:40:37',1,2),(15,15,1,90,1,'2025-03-31 16:40:46',1,2),(16,8,1,90,NULL,'2025-03-31 16:47:35',1,1);

--
-- Table structure for table `kuwetystatuszamowienia`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `kuwetystatuszamowienia` (
  `KuwStatZamId` int(11) NOT NULL AUTO_INCREMENT,
  `KuwStatZamNazwa` varchar(255) NOT NULL,
  `KuwStatZamDataZmiany` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`KuwStatZamId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kuwetystatuszamowienia`
--

INSERT INTO `kuwetystatuszamowienia` (`KuwStatZamId`, `KuwStatZamNazwa`, `KuwStatZamDataZmiany`) VALUES (1,'Dostępna','2025-04-01 13:18:03'),(2,'Zamowiona','2025-04-01 13:18:03'),(3,'Bufor','2025-04-01 13:18:03');

--
-- Table structure for table `rcp`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `rcp` (
  `RCPId` int(11) NOT NULL AUTO_INCREMENT,
  `RCPStartZmiany` datetime DEFAULT NULL,
  `RCPKoniecZmiany` datetime DEFAULT NULL,
  `RCPUzId` int(11) NOT NULL,
  PRIMARY KEY (`RCPId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcp`
--

INSERT INTO `rcp` (`RCPId`, `RCPStartZmiany`, `RCPKoniecZmiany`, `RCPUzId`) VALUES (1,'2025-03-31 16:40:55','2025-03-31 16:51:09',1),(2,'2025-03-31 16:51:58','2025-03-31 16:52:01',1),(3,'2025-03-31 16:52:06','2025-04-01 13:49:50',1),(4,'2025-04-01 13:51:03',NULL,1);

--
-- Table structure for table `rozmiary`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `rozmiary` (
  `RozId` int(11) NOT NULL AUTO_INCREMENT,
  `RozNazwa` varchar(255) NOT NULL,
  `RozPojemnosc` int(11) NOT NULL,
  `RozDataZmiany` datetime NOT NULL DEFAULT current_timestamp(),
  `RozStatus` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`RozId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rozmiary`
--

INSERT INTO `rozmiary` (`RozId`, `RozNazwa`, `RozPojemnosc`, `RozDataZmiany`, `RozStatus`) VALUES (1,'Kuweta Duża',90,'2025-03-31 16:37:59',1),(2,'Kuweta Mała',75,'2025-03-31 16:38:06',1);

--
-- Table structure for table `sklepy`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sklepy` (
  `SklId` int(11) NOT NULL AUTO_INCREMENT,
  `SklNazwa` varchar(255) NOT NULL,
  `SklUlica` varchar(255) DEFAULT NULL,
  `SklNumer` varchar(255) DEFAULT NULL,
  `SklKod` varchar(255) DEFAULT NULL,
  `SklMiejscowosc` varchar(255) DEFAULT NULL,
  `SklPojemnosc` int(11) NOT NULL,
  `SklDataZmiany` datetime NOT NULL DEFAULT current_timestamp(),
  `SklStatus` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`SklId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sklepy`
--

INSERT INTO `sklepy` (`SklId`, `SklNazwa`, `SklUlica`, `SklNumer`, `SklKod`, `SklMiejscowosc`, `SklPojemnosc`, `SklDataZmiany`, `SklStatus`) VALUES (1,'Prusa','Bolesława Prusa','33','30-117','Kraków',20,'2025-03-31 16:38:29',1);

--
-- Table structure for table `smaki`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `smaki` (
  `SmkId` int(11) NOT NULL AUTO_INCREMENT,
  `SmkNazwa` varchar(255) NOT NULL,
  `SmkDataZmiany` datetime NOT NULL DEFAULT current_timestamp(),
  `SmkKolor` varchar(255) DEFAULT NULL,
  `SmkTekstKolor` varchar(255) DEFAULT NULL,
  `SmkStatus` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`SmkId`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smaki`
--

INSERT INTO `smaki` (`SmkId`, `SmkNazwa`, `SmkDataZmiany`, `SmkKolor`, `SmkTekstKolor`, `SmkStatus`) VALUES (1,'Czekolada','2025-03-31 16:31:43','#610000','#ffffff',1),(2,'Ciastko','2025-03-31 16:32:07','#dd910e','#ffffff',1),(3,'Toffi','2025-03-31 16:32:28','#c8921e','#ffffff',1),(4,'Truskawka','2025-03-31 16:32:36','#ff0000','#ffffff',1),(5,'Malina','2025-03-31 16:32:48','#ff007b','#ffffff',1),(6,'Wiśnia','2025-03-31 16:32:58','#b80000','#ffffff',1),(7,'Mięta','2025-03-31 16:33:14','#3cec88','#000000',1),(8,'Guma balonowa','2025-03-31 16:33:26','#00fbff','#000000',1),(9,'Banan','2025-03-31 16:33:39','#ffea00','#000000',1),(10,'Limonka','2025-03-31 16:33:55','#00eb2f','#000000',1),(11,'Śmietanka','2025-03-31 16:34:16','#ffffff','#000000',1),(12,'Kawa','2025-03-31 16:34:27','#420000','#ffffff',1),(13,'Borówka','2025-03-31 16:34:44','#004db3','#ffffff',1),(14,'Kinder niespodzianka','2025-03-31 16:36:22','#f43b23','#ffffff',1),(15,'Oreo','2025-03-31 16:37:41','#2b52af','#ffffff',1);

--
-- Table structure for table `towary`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `towary` (
  `TowId` int(11) NOT NULL AUTO_INCREMENT,
  `TowNazwa` varchar(255) NOT NULL,
  `TowCenaId` int(11) NOT NULL,
  `TowDataZmiany` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`TowId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `towary`
--


--
-- Table structure for table `ulozenie`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `ulozenie` (
  `UId` int(11) NOT NULL AUTO_INCREMENT,
  `UKuw1Id` int(11) DEFAULT NULL,
  `UKuw2Id` int(11) DEFAULT NULL,
  `UKuw3Id` int(11) DEFAULT NULL,
  `UKuw4Id` int(11) DEFAULT NULL,
  `UKuw5Id` int(11) DEFAULT NULL,
  `UKuw6Id` int(11) DEFAULT NULL,
  `UKuw7Id` int(11) DEFAULT NULL,
  `UKuw8Id` int(11) DEFAULT NULL,
  `UKuw9Id` int(11) DEFAULT NULL,
  `UKuw10Id` int(11) DEFAULT NULL,
  `USklId` int(11) NOT NULL,
  `UDataZmiany` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`UId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ulozenie`
--

INSERT INTO `ulozenie` (`UId`, `UKuw1Id`, `UKuw2Id`, `UKuw3Id`, `UKuw4Id`, `UKuw5Id`, `UKuw6Id`, `UKuw7Id`, `UKuw8Id`, `UKuw9Id`, `UKuw10Id`, `USklId`, `UDataZmiany`) VALUES (1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'2025-03-31 16:38:29');

--
-- Table structure for table `uzytkownicy`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `uzytkownicy` (
  `UzId` int(11) NOT NULL AUTO_INCREMENT,
  `UzImie` varchar(255) NOT NULL,
  `UzNazwisko` varchar(255) NOT NULL,
  `UzLogin` varchar(255) DEFAULT NULL,
  `UzHaslo` varchar(255) DEFAULT NULL,
  `UzPIN` varchar(255) DEFAULT NULL,
  `UzStatus` tinyint(1) NOT NULL DEFAULT 1,
  `UzStawkaGodzinowa` float DEFAULT 0,
  `UzDataZmiany` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`UzId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uzytkownicy`
--

INSERT INTO `uzytkownicy` (`UzId`, `UzImie`, `UzNazwisko`, `UzLogin`, `UzHaslo`, `UzPIN`, `UzStatus`, `UzStawkaGodzinowa`, `UzDataZmiany`) VALUES (1,'Mateusz','Gancarz','mati','$2b$10$ccMFk7NUAkVuHyG1d.idfuI41E/YjcxcrwSf8crllO5MsA5iCacUO','$2b$10$zOJGdYI0FmF4T/Kma8MNhOSC.CdnH.8YKGJaD8GqxpRphhDe0Q9ru',1,35,'2025-03-31 16:38:57');

--
-- Table structure for table `uzytkownicysklep`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `uzytkownicysklep` (
  `UzSklId` int(11) NOT NULL AUTO_INCREMENT,
  `UzSklUzId` int(11) NOT NULL,
  `UzSklSklId` int(11) NOT NULL,
  PRIMARY KEY (`UzSklId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uzytkownicysklep`
--

INSERT INTO `uzytkownicysklep` (`UzSklId`, `UzSklUzId`, `UzSklSklId`) VALUES (1,1,1);

--
-- Dumping routines for database 'lody_lacko'
--
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `rejestruj_zmiane`(IN user_id INT)
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
    END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-01 16:55:37
