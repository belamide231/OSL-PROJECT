CREATE PROCEDURE create_account(
    parameter_username VARCHAR(99), 
    parameter_password VARCHAR(99), 
    parameter_email VARCHAR(99), 
    parameter_company_name VARCHAR(99), 
    parameter_role VARCHAR(99))
BEGIN

    IF EXISTS(SELECT 1 FROM tbl_users WHERE user = parameter_username) THEN
        SELECT 'Username already taken' AS message, 404 AS status_code;
    ELSE 

        INSERT INTO tbl_users(
            user, 
            password)
        VALUES(
            parameter_username, 
            parameter_password);

        SET @last_inserted_id = LAST_INSERT_ID();

        INSERT INTO tbl_roles(
            user_id, 
            company_name, 
            role)
        VALUES(
            @last_inserted_id, 
            parameter_company_name, 
            parameter_role);

        INSERT INTO tbl_profiles(
            user_id, 
            email, 
            first_name)
        VALUES(
            @last_inserted_id, 
            parameter_email, 
            parameter_email);

        SELECT 'Account created successfully' as message, 200 AS status_code;
    END IF;
END;;


CREATE PROCEDURE login_account(IN parameter_username VARCHAR(99))
BEGIN

    SELECT id, password INTO @id, @password FROM tbl_users WHERE user = parameter_username LIMIT 1;

    SELECT role, company_name INTO @role, @company_name FROM tbl_roles WHERE user_id = @id LIMIT 1;
    SELECT first_name, picture INTO @name, @picture FROM tbl_profiles WHERE user_id = @id LIMIT 1;
    SELECT @id AS id, @password AS password, @role AS role, @company_name AS company, @name AS name, @picture AS picture;

END;;



CREATE PROCEDURE get_client_names(IN clients_id VARCHAR(5000))
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE client_id INT;
    DECLARE cur CURSOR FOR 
        SELECT CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(clients_id, ',', numbers.n), ',', -1) AS UNSIGNED) AS client_id
        FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 
              UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 
              UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 
              UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 
              UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 
              UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30) numbers
        WHERE numbers.n <= LENGTH(clients_id) - LENGTH(REPLACE(clients_id, ',', '')) + 1;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    DROP TEMPORARY TABLE IF EXISTS tempResults;
    CREATE TEMPORARY TABLE tempResults (id INT, name VARCHAR(99), role VARCHAR(99), picture VARCHAR(5000));

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO client_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SELECT first_name, picture INTO @name, @picture FROM tbl_profiles WHERE user_id = client_id LIMIT 1;
        SELECT role INTO @role FROM tbl_roles WHERE user_id = client_id LIMIT 1;

        INSERT INTO tempResults (id, name, role, picture) VALUES (client_id, @name, @role, @picture);

    END LOOP;

    CLOSE cur;

    SELECT * FROM tempResults;
END;;