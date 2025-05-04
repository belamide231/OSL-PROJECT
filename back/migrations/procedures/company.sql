
CREATE PROCEDURE fetch_authorities(
    parameter_company VARCHAR(99)
)
BEGIN
    SELECT 
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', p.user_id,
                'name', p.first_name,
                'role', r.role,
                'company', r.company_name,
                'picture', p.picture
            )
        ) AS Authorities
    FROM tbl_profiles AS p
    JOIN tbl_roles AS r
        ON p.user_id = r.user_id
    WHERE 
        r.company_name = parameter_company AND 
        r.role = 'account';
END;;


CREATE PROCEDURE fetch_theme(
    parameter_company VARCHAR(99)
)
BEGIN
    SELECT 
        primary_color 	AS '--primary-color', 
        secondary_color AS '--secondary-color', 
        accent_color 	AS '--accent-color', 
        whites_color 	AS '--whites-color'
    FROM tbl_company_theme 
    WHERE company = parameter_company;
END;;