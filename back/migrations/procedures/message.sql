
CREATE PROCEDURE get_user_id(IN in_user VARCHAR(20), OUT out_id INT)
BEGIN
  SELECT
    id INTO out_id
  FROM tbl_users
  WHERE
    user = in_user
  LIMIT 1;
END;;



CREATE PROCEDURE insert_message(
  IN in_message_id INT, 
  IN in_content_status VARCHAR(20), 
  IN in_sent_at DATETIME,
  IN in_delivered_at DATETIME, 
  IN in_seen_at DATETIME, 
  IN in_company_name VARCHAR(100), 
  IN in_sender_id INT, 
  IN in_receiver_id INT, 
  IN in_content_type VARCHAR(10), 
  IN in_content VARCHAR(7999)
) BEGIN

  DECLARE prev_message_id INT DEFAULT 0;
  DECLARE prev_sent_at DATETIME;

  INSERT INTO tbl_messages(id, content_status, sent_at, delivered_at, seen_at, company_name, sender_id, receiver_id, content_type, content) 
  VALUES (in_message_id, in_content_status, in_sent_at, IFNULL(in_delivered_at, NULL), IFNULL(in_seen_at, NULL), IFNULL(in_company_name, NULL), in_sender_id, in_receiver_id, in_content_type, in_content);

  SELECT message_id, sent_at INTO prev_message_id, prev_sent_at
  FROM tbl_messages_head
  WHERE (sender_id = in_sender_id  AND receiver_id = in_receiver_id)
  OR (sender_id = in_receiver_id AND receiver_id = in_sender_id);

  IF prev_message_id != 0 AND in_sent_at >= prev_sent_at THEN
    UPDATE tbl_messages_head
      SET sent_at = in_sent_at, message_id = in_message_id, sender_id = in_sender_id, receiver_id = in_receiver_id
      WHERE message_id = prev_message_id;
  ELSEIF prev_message_id = 0 THEN
    INSERT INTO tbl_messages_head(sent_at, message_id, sender_id, receiver_id) VALUES (in_sent_at, in_message_id, in_sender_id, in_receiver_id);
  END IF;

END;;



CREATE PROCEDURE get_conversation(IN in_user_id VARCHAR(20), IN in_chatmate_id VARCHAR(20))
BEGIN
  IF in_user_id = in_chatmate_id
  THEN
    SELECT (
      SELECT first_name AS name FROM tbl_profiles WHERE user_id = in_chatmate_id LIMIT 1
    ) AS chatmate, in_chatmate_id AS chatmate_id, id, sent_at, content_type, content, sender_id, (
      SELECT first_name AS name FROM tbl_profiles WHERE user_id = sender_id LIMIT 1
    ) AS sender, receiver_id, (
      SELECT first_name AS name FROM tbl_profiles WHERE user_id = receiver_id LIMIT 1
    ), content_status, delivered_at, seen_at, company_name
    FROM tbl_messages
    WHERE (sender_id = in_user_id AND receiver_id = $user_id)
    ORDER BY sent_at DESC
    LIMIT 30;
  ELSE
    SELECT (
        SELECT first_name AS name FROM tbl_profiles WHERE user_id = in_chatmate_id LIMIT 1
      ) AS chatmate, in_chatmate_id as chatmate_id, id, sent_at, content_type, content, sender_id, (
        SELECT first_name AS name FROM tbl_profiles WHERE user_id = sender_id LIMIT 1
      ) AS sender, receiver_id, (
        SELECT first_name AS name FROM tbl_profiles WHERE user_id = receiver_id LIMIT 1
      ) AS receiver, content_status, delivered_at, seen_at, company_name
    FROM tbl_messages
    WHERE in_user_id IN (sender_id, receiver_id)
    AND in_chatmate_id IN (sender_id, receiver_id)
    ORDER BY sent_at DESC
    LIMIT 30;
  END IF;
END;;



CREATE PROCEDURE migration_status(
  IN in_sender_id INT, 
  IN in_receiver_id INT, 
  IN in_status VARCHAR(20), 
  IN in_delivered_at DATETIME, 
  IN in_seen_at DATETIME
) BEGIN

  DECLARE latest_status VARCHAR(20);
  SET latest_status = (
    SELECT 
      content_status 
    FROM tbl_messages 
    WHERE sender_id = in_sender_id 
    AND receiver_id = in_receiver_id
    ORDER BY sent_at DESC
    LIMIT 1);

  IF in_status = 'delivered' THEN

    UPDATE tbl_messages
    SET 
      content_status = in_status, 
      delivered_at = in_delivered_at
    WHERE sender_id = in_sender_id 
    AND receiver_id = in_receiver_id
    AND content_status = 'sent';
  
  ELSEIF in_status = 'seen' THEN

    UPDATE tbl_messages
    SET 
      content_status = in_status,
      delivered_at = CASE
        WHEN delivered_at IS NOT NULL THEN delivered_at
        ELSE in_delivered_at
      END,
      seen_at = in_seen_at
    WHERE sender_id = in_sender_id 
    AND receiver_id = in_receiver_id
    AND (content_status = 'sent' OR content_status = 'delivered');

  END IF;

END;;



CREATE PROCEDURE migrate_status_by_loading_more_messages (
  IN in_sender_id INT,
  IN in_receiver_id INT,
  IN in_sender_message_status VARCHAR(10),
  IN in_sender_message_delivered_at DATETIME,
  IN in_sender_message_seen_at DATETIME
) BEGIN

  DECLARE sender_message_status VARCHAR(10) DEFAULT 'sent';
  IF EXISTS (SELECT 1 FROM tbl_messages WHERE sender_id = in_sender_id AND receiver_id = in_receiver_id ORDER BY sent_at DESC LIMIT 1) THEN

    SELECT content_status INTO sender_message_status FROM tbl_messages WHERE sender_id = in_sender_id AND receiver_id = in_receiver_id ORDER BY sent_at DESC LIMIT 1;
    IF sender_message_status != 'seen' OR in_sender_message_status != 'sent' OR sender_message_status != in_sender_message_status THEN

      UPDATE tbl_messages
      SET 
        content_status = sender_message_status,
        delivered_at = in_sender_message_delivered_at,
        seen_at = CASE
          WHEN in_sender_message_status = 'seen' THEN in_sender_message_seen_at 
          ELSE seen_at
        END
      WHERE sender_id = in_sender_id
      AND receiver_id = in_receiver_id
      AND (
        (in_sender_message_status = 'delivered' AND content_status = 'sent') OR
        (in_sender_message_status = 'seen' AND content_status IN ('sent', 'delivered'))
      );
    END IF; 
  END IF;
END;;



CREATE PROCEDURE load_more_messages(
  IN in_message_length INT, 
  IN in_user_id INT, 
  IN in_chatmate_id INT, 
  IN in_limit INT)
BEGIN

  SELECT (
    SELECT first_name FROM tbl_profiles WHERE user_id = in_chatmate_id
  ) AS chatmate, in_chatmate_id AS chatmate_id, id, sent_at, content_type, content, sender_id, (
    SELECT first_name FROM tbl_profiles WHERE user_id = sender_id
  ) AS sender, receiver_id, (
    SELECT first_name FROM tbl_profiles WHERE user_id = receiver_id
  ) AS receiver, content_status, delivered_at, seen_at, company_name
  FROM tbl_messages
  WHERE (
    in_user_id IN(sender_id, receiver_id) AND in_chatmate_id IN(sender_id, receiver_id)
  ) ORDER BY sent_at DESC LIMIT in_limit OFFSET in_message_length;
END;;



CREATE PROCEDURE get_chat_list(IN in_chat_list_length INT, IN in_user INT, in in_exception VARCHAR(7999))
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE in_chatmate_id INT;
  DECLARE cur CURSOR FOR
    SELECT
      CASE
        WHEN sender_id != in_user THEN sender_id
        ELSE receiver_id
      END AS chatmate_id
    FROM tbl_messages_head
    WHERE in_user IN(sender_id, receiver_id)
    ORDER BY sent_at DESC
    LIMIT 15 OFFSET in_chat_list_length;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  
  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO in_chatmate_id;
    IF done THEN
      LEAVE read_loop;
    END IF;

    IF FIND_IN_SET(in_chatmate_id, in_exception) != 0 THEN
      ITERATE read_loop;
    END IF;

    -- CALL load_more_messages(0, in_user, in_chatmate_id, IF(in_chat_list_length = 0, 15, 1));
    CALL load_more_messages(0, in_user, in_chatmate_id, 1);

  END LOOP;

  CLOSE cur;
END;;



CREATE PROCEDURE chat_delivered(IN in_user_id INT, IN stamp DATETIME)
BEGIN

  DROP TEMPORARY TABLE IF EXISTS chatmate_list;
  CREATE TEMPORARY TABLE chatmate_list(chatmate_id INT, message_id INT);

  DROP TEMPORARY TABLE IF EXISTS notify_list;
  CREATE TEMPORARY TABLE notify_list(notify_id INT);

  INSERT INTO chatmate_list(chatmate_id, message_id) 
  SELECT 
    CASE
      WHEN sender_id != in_user_id THEN sender_id
      ELSE receiver_id
    END,
    message_id
  FROM tbl_messages_head
  WHERE sender_id = in_user_id 
    OR receiver_id = in_user_id;

  INSERT INTO notify_list(notify_id)
  SELECT t1.chatmate_id
  FROM chatmate_list as t1
  JOIN tbl_messages as t2
    ON t1.message_id = t2.id
  WHERE content_status = 'sent'
  AND receiver_id = in_user_id;

  SELECT notify_id AS chatmate_id FROM notify_list;

END;;



CREATE PROCEDURE relocate_conversation (
  IN in_user1 VARCHAR(20),
  IN in_user2 VARCHAR(20)
)
BEGIN

  CALL get_user_id(in_user1, @user1_id);
  CALL get_user_id(in_user2, @user2_id);

  IF (@user1_id IS NOT NULL AND @user2_id IS NOT NULL)
  THEN

    CREATE TEMPORARY TABLE temp_selected_messages_id AS
      SELECT
        id
      FROM tbl_messages
      WHERE
        (sender_id = @user1_id AND receiver_id = @user2_id)
      OR
        (sender_id = @user2_id AND receiver_id = @user1_id)
      ORDER BY sent_at DESC;

    SET @head = (
      SELECT
        id
      FROM
        temp_selected_messages_id
      LIMIT 1
    );

    INSERT INTO tbl_messages_head_logs (
      sent_at,
      sender_id,
      receiver_id
    )
    SELECT
      sent_at,
      sender_id,
      receiver_id
    FROM tbl_messages
    WHERE
      id = @head;

    SET @head_id = (SELECT LAST_INSERT_ID());

    INSERT INTO tbl_messages_logs(
      head_id,
      sent_at,
      content_type,
      content,
      sender_id,
      receiver_id,
      content_status,
      delivered_at,
      seen_at
    )
    SELECT
      @head_id,
      t1.sent_at,
      t1.content_type,
      t1.content,
      t1.sender_id,
      t1.receiver_id,
      t1.content_status,
      t1.delivered_at,
      t1.seen_at
    FROM tbl_messages AS t1
    JOIN temp_selected_messages_id AS t2
      ON t1.id = t2.id;

    DELETE
    FROM tbl_messages_head
    WHERE message_id = @head;

    DELETE t1
    FROM tbl_messages t1
    JOIN temp_selected_messages_id t2
      ON t1.id = t2.id;

    DROP TEMPORARY TABLE temp_selected_messages_id;

  ELSE

    SELECT "PARAMETERS DID NOT MATCH" AS ERROR;

  END IF;

END;;



CREATE PROCEDURE get_conversation_logs(IN in_head_id INT)
BEGIN

  SELECT
    *
  FROM tbl_messages_logs
  WHERE
    head_id = in_head_id
  ORDER BY sent_at DESC;

END;;



CREATE PROCEDURE get_conversations_heads_logs()
BEGIN

  SELECT
    *
  FROM tbl_messages_head_logs
  ORDER BY sent_at DESC;

END;;



CREATE PROCEDURE get_message(IN in_message_id INT, IN in_user_id INT)
BEGIN

  DECLARE chatmate_id INT;

  SELECT
    CASE
      WHEN sender_id != in_user_id THEN sender_id
      ELSE receiver_id
    END AS chatmate_id
  INTO chatmate_id
  FROM tbl_messages
  WHERE id = in_message_id;

  SELECT (
      SELECT first_name FROM tbl_profiles WHERE user_id = chatmate_id) AS chatmate, chatmate_id,
    id, sent_at, content_type, content, sender_id, (
      SELECT first_name FROM tbl_profiles WHERE user_id = sender_id
    ) AS sender, receiver_id, (
      SELECT first_name FROM tbl_profiles WHERE user_id = chatmate_id
    ) AS receiver, content_status, delivered_at, seen_at, company_name
  FROM tbl_messages
  WHERE id = in_message_id;

END;;


CREATE PROCEDURE seen_chat(IN in_seender_id INT, IN in_chatmate_id INT)
BEGIN

  SET @timestamp = CURRENT_TIMESTAMP;

  UPDATE tbl_messages
  SET content_status = 'seen', seen_at = CURRENT_TIMESTAMP
  WHERE receiver_id = in_seender_id
    AND sender_id = in_chatmate_id
    AND (content_status = 'delivered' OR content_status = 'sent');
  
  SELECT @timestamp AS timestamp;

END;;
