-- Username: ibcadmin
-- Password: ibcadmin
CALL create_account("ibcadmin", "$2a$10$VEflIDT1RYW0Tj47vb5D..ZCKGT0oOVsc0y2xS6O9MHKew/oeZXrS", "belamidemills29@gmail.com", "*", "admin");
UPDATE tbl_profiles SET first_name = 'admin' WHERE user_id = 1;

CALL create_account("ibcaccount", NULL, "timoy@gmail.com", "ibc", "account");
UPDATE tbl_profiles SET first_name = 'timoy' WHERE user_id = 2;

-- CALL insert_message(999999999,  'sent', CAST('2025-03-06 16:02:35' AS DATETIME) - INTERVAL 5 HOUR, NULL, NULL, NULL, 1, 3, 'text', 'HELLO GIS ADMIN');
-- CALL insert_message(1000000000, 'sent', CAST('2025-03-06 16:02:35' AS DATETIME) - INTERVAL 3 HOUR, NULL, NULL, NULL, 1, 2, 'text', 'HELLO JET ADMIN');
-- CALL insert_message(1000000001, 'sent', CAST('2025-03-06 16:02:35' AS DATETIME) - INTERVAL 1 HOUR, NULL, NULL, NULL, 1, 4, 'text', 'HELLO IBM ADMIN');
-- CALL insert_message(1000000002, 'sent', CAST('2025-03-06 16:02:35' AS DATETIME), NULL, NULL, NULL, 1, 2, 'text', 'HELLO IBM ADMIN');
-- CALL insert_message(1000000003, 'sent', CAST('2025-03-06 16:02:35' AS DATETIME), NULL, NULL, NULL, 1, 2, 'text', 'HELLO IBM ADMIN');
-- CALL insert_message(1000000004, 'sent', CAST('2025-03-06 16:02:35' AS DATETIME), NULL, NULL, NULL, 1, 2, 'text', 'HELLO IBM ADMIN');
-- CALL insert_message(1000000005, 'sent', CAST('2025-03-06 16:02:35' AS DATETIME), NULL, NULL, NULL, 1, 2, 'text', 'HELLO IBM ADMIN');
-- CALL insert_message(1000000006, 'sent', CAST('2025-03-06 16:02:35' AS DATETIME), NULL, NULL, NULL, 1, 2, 'text', 'HELLO IBM ADMIN');


-- CALL insert_message(1,  DATE_SUB(NOW(), INTERVAL 100 YEAR), "text", "Hello there GIS admin1", 1, 3);
-- CALL insert_message(2,  DATE_SUB(NOW(), INTERVAL 3 YEAR), "text", "Hello there GIS admin2", 1, 3);
-- CALL insert_message(3,  DATE_SUB(NOW(), INTERVAL 35 DAY), "text", "Hello there GIS admin3", 1, 3);
-- CALL insert_message(4,  DATE_SUB(NOW(), INTERVAL 15 DAY), "text", "Hello there GIS admin4", 1, 3);
-- CALL insert_message(5,  DATE_SUB(NOW(), INTERVAL 5 DAY), "text", "Hello there GIS admin5", 1, 3);
-- CALL insert_message(6,  DATE_SUB(NOW(), INTERVAL 1 DAY), "text", "Hello there GIS admin5", 1, 3);
-- CALL insert_message(7,  DATE_SUB(NOW(), INTERVAL 1 HOUR), "text", "Hello there GIS admin6", 1, 3);
-- CALL insert_message(8,  NOW(), "text", "HELLO WORLD!", 1, 2);  
-- CALL insert_message(9,  NOW(), "text", "HELLO WORLD!", 1, 3);  
-- CALL insert_message(10, NOW(), "text", "HELLO WORLD!", 2, 3);