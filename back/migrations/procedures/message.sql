

CREATE PROCEDURE string_stamp_converter (
  string_stamp VARCHAR(99),
  OUT converted_stamp VARCHAR(99)
) 
BEGIN
  SET converted_stamp = REPLACE(SUBSTRING(string_stamp, 1, 19), 'T', ' ');
END;;



CREATE PROCEDURE update_members_status (
  parameter_chat_id INT,
  parameter_member_id VARCHAR(99),
  parameter_member_deliver_stamp VARCHAR(99),
  parameter_member_seen_stamp VARCHAR(99)
)
PROC: BEGIN

  IF parameter_member_deliver_stamp IS NULL THEN
    LEAVE PROC;
  END IF;

  CALL string_stamp_converter(parameter_member_deliver_stamp, @deliver_stamp);
  UPDATE tbl_chat_members 
  SET 
    member_message_delivered_stamp = @deliver_stamp
  WHERE 
    chat_id = parameter_chat_id AND 
    member_id = parameter_member_id;

  WITH user_chat_id_list AS (
    SELECT 
      t1.chat_id 
    FROM tbl_chats AS t1
    JOIN tbl_chat_members AS t2
      ON t1.chat_id = t2.chat_id
    WHERE 
      t1.is_recepient_customer = TRUE AND
      t2.member_id = parameter_member_id
  )
  UPDATE tbl_chat_members
  SET 
    member_message_delivered_stamp = @deliver_stamp
  WHERE 
    member_id = parameter_member_id AND 
    chat_id IN (
      SELECT chat_id FROM user_chat_id_list
    );

  IF parameter_member_seen_stamp IS NULL THEN
    LEAVE PROC;
  END IF;

  CALL string_stamp_converter(parameter_member_seen_stamp, @seen_stamp);
  UPDATE tbl_chat_members 
  SET 
    member_message_seen_stamp = @seen_stamp 
  WHERE 
    chat_id = parameter_chat_id AND 
    member_id = parameter_member_id;

END;;



CREATE PROCEDURE insert_messages (
  parameter_last_element BOOLEAN,
  parameter_chat_id INT,
  parameter_message_id INT,
  parameter_sent_at VARCHAR(99),
  parameter_sender VARCHAR(99),
  parameter_sender_id VARCHAR(99),
  parameter_message_type VARCHAR(10),
  parameter_message VARCHAR(9999)
)
BEGIN

  CALL string_stamp_converter(parameter_sent_at, @converted_stamp);

  IF parameter_last_element THEN
    UPDATE tbl_chats SET latest_message_id = parameter_message_id, latest_message_stamp = @converted_stamp WHERE chat_id = parameter_chat_id;
  END IF;

  INSERT INTO tbl_chat_messages(
    message_id, 
    chat_id,
    sent_at,
    sender_id,
    sender,
    message_type,
    message
  )
  VALUES(
    parameter_message_id,
    parameter_chat_id,
    @converted_stamp,
    parameter_sender_id,
    parameter_sender,
    parameter_message_type,
    parameter_message
  );

END;;



CREATE PROCEDURE creating_chat (
  parameter_chat_id INT,
  parameter_member_id_list VARCHAR(9999),
  parameter_is_recepient_customer BOOLEAN
)
BEGIN
  DECLARE list VARCHAR(9999) DEFAULT parameter_member_id_list;
  DECLARE element VARCHAR(9999);
  DECLARE coma INT DEFAULT 0;

  INSERT INTO tbl_chats(chat_id, is_recepient_customer) VALUES(parameter_chat_id, parameter_is_recepient_customer);
  WHILE list != '' DO
    SET coma = LOCATE(',', list);
    IF coma = 0 THEN
      SET element = list;
      SET list = '';
    ELSE
      SET element = SUBSTRING(list, 1, coma - 1);
      SET list = SUBSTRING(list, coma + 1);
    END IF;
    SET @member = COALESCE((SELECT first_name FROM tbl_profiles WHERE user_id = element LIMIT 1), element);
    INSERT INTO tbl_chat_members(chat_id, member_id, member) VALUES(parameter_chat_id, element, @member);
  END WHILE;
  SELECT 200 AS status;

END;;



CREATE PROCEDURE get_chats(
  parameter_user_id VARCHAR(99),
  parameter_offset INT,
  parameter_limit INT,
  parameter_exception_list VARCHAR(9999)
)
BEGIN

  WITH
  tbl_chat_list AS (
    SELECT 
      T1.chat_id 
    FROM tbl_chat_members AS T1
    INNER JOIN tbl_chats AS T2
      ON T1.chat_id = T2.chat_id
    WHERE 
      T1.member_id = parameter_user_id AND
      NOT FIND_IN_SET(T1.chat_id, parameter_exception_list)
    ORDER BY t2.latest_message_stamp DESC
    LIMIT parameter_offset, parameter_limit
  ),
  tbl_chat_head_message AS (
    SELECT 
      T1.chat_id,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'message_id', T2.message_id,
          'chat_id', T2.chat_id,
          'sent_at', T2.sent_at,
          'sender_id', T2.sender_id,
          'message_type', T2.message_type,
          'message', T2.message
        )
      ) AS Messages
    FROM tbl_chats AS T1
    RIGHT JOIN tbl_chat_messages AS T2
      ON T1.chat_id = T2.chat_id 
      AND T1.latest_message_id = T2.message_id
    WHERE 
      T1.chat_id IN (
        SELECT 
          chat_id
        FROM tbl_chat_list
      )
    GROUP BY T1.chat_id
    ORDER BY T1.latest_message_id DESC
  ),
  tbl_chat_members AS (
    SELECT 
      chat_id,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'member_id', member_id,
          'member_message_delivered_stamp', member_message_delivered_stamp,
          'member_message_seen_stamp', member_message_seen_stamp
        )
      ) AS Status
    FROM tbl_chat_members
    WHERE 
      chat_id IN (
        SELECT 
          chat_id
        FROM tbl_chat_list
      )
    GROUP BY chat_id
  )
  SELECT 
    T1.Messages,
    T2.Status
  FROM tbl_chat_head_message AS T1
  JOIN tbl_chat_members AS T2
    ON T1.chat_id = T2.chat_id
  GROUP BY T1.chat_id;

END;;



CREATE PROCEDURE update_chat_status (
  parameter_update VARCHAR(99),
  parameter_stamp VARCHAR(99),
  parameter_chat_id INT,
  parameter_user_id VARCHAR(99)
) PROC: BEGIN

  CALL string_stamp_converter(parameter_stamp, @stamp);

  IF parameter_update = 'seen' THEN 

    UPDATE tbl_chat_members AS T1
    LEFT JOIN tbl_chats AS T2 
      ON T1.chat_id = T2.chat_id
    SET
      T1.member_message_seen_stamp = @stamp
    WHERE 
      T1.chat_id = parameter_chat_id AND 
      T1.member_id = parameter_user_id AND
      (T1.member_message_seen_stamp IS NULL OR T2.latest_message_stamp > T1.member_message_seen_stamp);
      
    -- IF (SELECT member_message_seen_stamp FROM tbl_chat_members WHERE chat_id = parameter_chat_id AND member_id = parameter_user_id) != @stamp THEN
    --   LEAVE PROC;
    -- END IF;  

  ELSE

    UPDATE tbl_chat_members AS T1
    LEFT JOIN tbl_chats AS T2
      ON T1.chat_id = T2.chat_id
    SET
      T1.member_message_delivered_stamp = @stamp
    WHERE 
      T1.chat_id = parameter_chat_id AND 
      T1.member_id = parameter_user_id AND
      (T1.member_message_delivered_stamp IS NULL OR T2.latest_message_stamp > T1.member_message_delivered_stamp);

    -- IF (SELECT member_message_delivered_stamp FROM tbl_chat_members WHERE chat_id = parameter_chat_id AND member_id = parameter_user_id) != @stamp THEN
    --   LEAVE PROC;
    -- END IF;

  END IF;

  WITH
  members AS (
    SELECT DISTINCT
      JSON_ARRAYAGG(member_id) AS members 
    FROM tbl_chat_members 
    WHERE 
      chat_id = parameter_chat_id
  ),
  member_status AS (
    SELECT 
      member_id,
      member_message_delivered_stamp,
      member_message_seen_stamp
    FROM tbl_chat_members
    WHERE 
      chat_id = parameter_chat_id AND
      member_id = parameter_user_id
    LIMIT 1
  )
  SELECT 
    CASE
      WHEN T2.member_message_delivered_stamp = @stamp AND parameter_update != 'seen' THEN TRUE
      WHEN T2.member_message_seen_stamp = @stamp AND parameter_update = 'seen' THEN TRUE
      ELSE FALSE
    END AS is_updated,
    T1.members AS members,
    JSON_OBJECT(
      'chat_id', parameter_chat_id,
      'member_status', JSON_OBJECT(
        'member_id', T2.member_id,
        'member_message_delivered_stamp', T2.member_message_delivered_stamp,
        'member_message_seen_stamp', T2.member_message_seen_stamp
      )
    ) AS status
  FROM members AS T1
  CROSS JOIN member_status AS T2;

END;;



CREATE PROCEDURE update_all_chat_to_delivered (
  parameter_stamp VARCHAR(99),
  parameter_user_id VARCHAR(99),
  parameter_exceptions VARCHAR(9999)
) BEGIN

  CALL string_stamp_converter(parameter_stamp, @stamp);

  UPDATE tbl_chat_members AS T1
  LEFT JOIN tbl_chats AS T2
    ON T1.chat_id = T2.chat_id
  SET T1.member_message_delivered_stamp = @stamp
  WHERE 
    -- T2.is_recepient_customer = TRUE AND
    T1.member_id = parameter_user_id AND
    (T1.member_message_delivered_stamp IS NULL OR T2.latest_message_stamp > T1.member_message_delivered_stamp) AND
    NOT FIND_IN_SET(T1.chat_id, parameter_exceptions);

  WITH 
  temp_tbl_chats AS (
    SELECT 
      T1.chat_id AS chats_chat_id
    FROM tbl_chat_members AS T1
    LEFT JOIN tbl_chats AS T2
      ON T1.chat_id = T2.chat_id
    WHERE 
      -- T2.is_recepient_customer = TRUE AND
      T1.member_id = parameter_user_id AND
      T1.member_message_delivered_stamp = @stamp AND
      NOT FIND_IN_SET(T1.chat_id, parameter_exceptions)
  ),
  temp_tbl_status AS (
    SELECT
      chat_id,
      member_id,
      member_message_delivered_stamp,
      member_message_seen_stamp
    FROM tbl_chat_members
    WHERE 
      chat_id IN (SELECT chats_chat_id FROM temp_tbl_chats) AND
      member_id = parameter_user_id
  )
  SELECT
    JSON_OBJECT(
      'chat_id', ANY_VALUE(T1.chat_id),
      'member_status', JSON_OBJECT(
        'member_id', ANY_VALUE(T2.member_id),
        'member_message_delivered_stamp', ANY_VALUE(T2.member_message_delivered_stamp),
        'member_message_seen_stamp', ANY_VALUE(T2.member_message_seen_stamp) 
      )
    ) as status,
    JSON_ARRAYAGG(T1.member_id) AS members
  FROM tbl_chat_members AS T1
  JOIN temp_tbl_status AS T2
    ON T1.chat_id = T2.chat_id
  WHERE 
    T1.chat_id IN (SELECT chats_chat_id FROM temp_tbl_chats)
  GROUP BY T1.chat_id;

END;;