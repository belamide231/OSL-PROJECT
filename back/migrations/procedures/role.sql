CREATE PROCEDURE add_role(IN in_user_id INT, IN in_company_name VARCHAR(99), IN in_role VARCHAR(99))
BEGIN

    INSERT INTO tbl_roles(user_id, company_name, role)
    VALUES(in_user_id, in_company_name, in_role);

END;;