CALL create_account("ibcadmin", "$2a$10$VEflIDT1RYW0Tj47vb5D..ZCKGT0oOVsc0y2xS6O9MHKew/oeZXrS", "belamidemills29@gmail.com", "ibc", "admin", "IBC Admin");
CALL create_account("jetadmin", "$2a$10$Iv8njZz1ljKIi8hvGjdAquLvGfZVD79zgdSj2H3nkYbEvWtnQeCCy", "belamidemills29@gmail.com", "jet", "admin", "Jet Admin");
CALL create_account("gisadmin", "$2a$10$36BvogjTCIMw5XVRveaQBuKleEsTSD4ZyXL7d/a/l8Oj2DZLUj6y6", "belamidemills29@gmail.com", "gis", "admin", "Gis Admin");



CALL insert_message(DATE_SUB(NOW(), INTERVAL 100 YEAR), "text", "Hello there GIS admin1", 1, 3);
CALL insert_message(DATE_SUB(NOW(), INTERVAL 3 YEAR), "text", "Hello there GIS admin2", 1, 3);
CALL insert_message(DATE_SUB(NOW(), INTERVAL 35 DAY), "text", "Hello there GIS admin3", 1, 3);
CALL insert_message(DATE_SUB(NOW(), INTERVAL 15 DAY), "text", "Hello there GIS admin4", 1, 3);
CALL insert_message(DATE_SUB(NOW(), INTERVAL 5 DAY), "text", "Hello there GIS admin5", 1, 3);
CALL insert_message(DATE_SUB(NOW(), INTERVAL 1 DAY), "text", "Hello there GIS admin5", 1, 3);
CALL insert_message(DATE_SUB(NOW(), INTERVAL 1 HOUR), "text", "Hello there GIS admin6", 1, 3);
CALL insert_message(NOW(), "text", "HELLO WORLD!", 1, 2);  
CALL insert_message(NOW(), "text", "HELLO WORLD!", 1, 3);  
CALL insert_message(NOW(), "text", "HELLO WORLD!", 2, 3);
