CREATE PROCEDURE fillup_profile(
    parameter_user_id VARCHAR(99),
    parameter_first_name VARCHAR(99),
    parameter_full_name VARCHAR(499),
    parameter_email VARCHAR(99),
    parameter_phone_number VARCHAR(99),
    parameter_address VARCHAR(499))
BEGIN

    INSERT INTO tbl_profiles(
        user_id, 
        first_name, 
        full_name, 
        email, 
        phone, 
        address, 
        picture)
    VALUES(
        parameter_user_id,
        parameter_first_name,
        parameter_full_name,
        parameter_email,
        parameter_phone_number,
        parameter_address);

END;;


CREATE PROCEDURE edit_profile(
    parameter_user_id INT, 
    parameter_first_name VARCHAR(99), 
    parameter_full_name VARCHAR(499),
    parameter_email VARCHAR(99),
    parameter_phone_number VARCHAR(11), 
    parameter_address VARCHAR(200)) 
BEGIN
    
    UPDATE tbl_profiles
    SET 
        first_name = parameter_first_name, 
        full_name = parameter_full_name,
        email = parameter_email,
        phone_number = parameter_phone_number, 
        address = parameter_address
    WHERE 
        user_id = parameter_user_id;

END;;