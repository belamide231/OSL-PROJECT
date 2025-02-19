CREATE PROCEDURE fillup_profile(IN in_user_id INT, IN in_first_name VARCHAR(99), IN in_last_name VARCHAR(99), IN in_middle_name VARCHAR(99), IN in_email VARCHAR(99), IN in_phone_number VARCHAR(11), IN in_address VARCHAR(200)) 
BEGIN

    CALL get_user_id(in_user, @out_user_id);

    INSERT INTO tbl_profiles(user_id, first_name, last_name, middle_name, email, phone_number, address)
    VALUES(@out_user_id, in_first_name, in_last_name, in_middle_name, in_email, in_phone_number, in_address);

END;;



CREATE PROCEDURE edit_profile(IN in_user_id INT, IN in_first_name VARCHAR(99), IN in_last_name VARCHAR(99), IN in_middle_name VARCHAR(99), IN in_email VARCHAR(99), IN in_phone_number VARCHAR(11), IN in_address VARCHAR(200)) BEGIN

    CALL get_user_id(in_user, @out_user_id);
    
    UPDATE tbl_profiles
    SET first_name = in_first_name, last_name = in_last_name, middle_name = in_middle_name, email = in_email, phone_number = in_phone_number, address = in_address
    WHERE user_id = @out_user_id;

END;;