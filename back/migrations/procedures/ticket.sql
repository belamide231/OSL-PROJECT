-- TICKETS

CREATE PROCEDURE create_ticket(
  IN in_user VARCHAR(199), 
  IN in_description VARCHAR(7999)
) BEGIN

  CALL get_user_id(in_user, @user_id);

  INSERT INTO tbl_tickets(user_id, description)
  VALUES(@user_id, in_description);

END;;



CREATE PROCEDURE get_pending_ticket_for_agent()
BEGIN

  SELECT * FROM tbl_tickets WHERE status = "pending for agent";

END;;



CREATE PROCEDURE accept_ticket_for_agent(IN in_ticket_id INT, IN in_agent VARCHAR(199), IN in_priority VARCHAR(10), IN in_issue_type VARCHAR(99)) 
BEGIN

  CALL get_user_id(in_agent, @agent_id);

  UPDATE tbl_tickets
  SET review_by_agent_at = CURRENT_TIMESTAMP, agent_id = @agent_id, priority = in_priority, issue_type = in_issue_type, status = "pending for developer"
  WHERE id = in_ticket_id;

END;;



CREATE PROCEDURE get_pending_ticket_for_developer()
BEGIN

  SELECT * FROM tbl_tickets WHERE status = "pending for developer";

END;;



CREATE PROCEDURE accept_ticket_for_developer(IN in_ticket_id INT, IN in_developer_name VARCHAR(99))
BEGIN

  UPDATE tbl_tickets
  SET developer_name = in_developer_name, debugging_at = CURRENT_TIMESTAMP, status = "debugging phase"
  WHERE id = in_ticket_id;

END;;



CREATE PROCEDURE resolve_ticket(IN in_ticket_id INT) 
BEGIN

  UPDATE tbl_tickets
  SET resolved_at = CURRENT_TIMESTAMP, status = "resolved"
  WHERE id = in_ticket_id;

END;;



CREATE PROCEDURE cancel_ticket(IN in_ticket_id INT) 
BEGIN

  UPDATE tbl_tickets
  SET status = "cancelled"
  WHERE id = in_ticket_id;

END;;



-- CALL create_ticket("timoy", "walay seen ang chat");
-- CALL accept_ticket_for_agent(1, "helsi", "medium", "login");
-- CALL accept_ticket_for_developer(1, "bensoy");
-- CALL resolve_ticket(1);
-- SELECT * FROM tbl_tickets;