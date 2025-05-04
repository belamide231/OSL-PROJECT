CREATE TABLE tbl_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user VARCHAR(99) UNIQUE,
    password VARCHAR(99),
    INDEX idx_user(user)
);
CREATE TABLE tbl_roles (
    user_id INT,
    company_name VARCHAR(99),
    role ENUM('admin', 'account') NOT NULL,
    FOREIGN KEY(user_id) REFERENCES tbl_users(id)
);
CREATE TABLE tbl_profiles (
    user_id INT,
    first_name VARCHAR(99),
    full_name VARCHAR(499),
    email VARCHAR(99),
    phone VARCHAR(11),
    address VARCHAR(200),
    picture VARCHAR(5000),
    FOREIGN KEY(user_id) REFERENCES tbl_users(id)
);


CREATE TABLE tbl_chats (
    chat_id INT UNIQUE NOT NULL,
    is_recepient_customer BOOLEAN NOT NULL,
    latest_message_id INT DEFAULT NULL,
    latest_message_stamp DATETIME DEFAULT NULL
);
CREATE TABLE tbl_chat_messages (
    message_id INT PRIMARY KEY UNIQUE NOT NULL,
    chat_id INT NOT NULL,
        FOREIGN KEY(chat_id) REFERENCES tbl_chats(chat_id),
        INDEX idx_chat_id (chat_id),
    sent_at DATETIME NOT NULL,
    sender_id VARCHAR(99) NOT NULL,
    sender VARCHAR(99) NOT NULL,
    message_type ENUM('text', 'file') NOT NULL,
    message VARCHAR(9999) 
);
CREATE TABLE tbl_chat_members (
    chat_id INT NOT NULL,
    member VARCHAR(99),
    member_id VARCHAR(99) NOT NULL,
    member_message_delivered_stamp DATETIME DEFAULT NULL,
    member_message_seen_stamp DATETIME DEFAULT NULL
);


CREATE TABLE tbl_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    status VARCHAR(50) DEFAULT "pending for agent",    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,     
    user_id INT,                                     
    description VARCHAR(7999),                       
    review_by_agent_at DATETIME DEFAULT NULL,
    agent_id INT DEFAULT NULL,
    priority VARCHAR(10) DEFAULT NULL,                  
    issue_type VARCHAR(99) DEFAULT NULL,               
    debugging_at DATETIME DEFAULT NULL,
    developer_name VARCHAR(99) DEFAULT NULL,
    resolved_at DATETIME DEFAULT NULL,               
    FOREIGN KEY(user_id) REFERENCES tbl_users(id),
    FOREIGN KEY(agent_id) REFERENCES tbl_users(id)
);


CREATE TABLE tbl_company_theme (
    company VARCHAR(99),
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    accent_color VARCHAR(20),
    whites_color VARCHAR(20)
);

INSERT INTO tbl_company_theme(company, primary_color, secondary_color, accent_color, whites_color) 
VALUES
("ibc", "rgb(0, 0, 0)", "rgb(255, 255, 255)", "rgb(255, 3, 5)", "rgb(255, 255, 255)"),
("jet", "rgb(0, 0, 0)", "rgb(255, 255, 255)", "rgb(255, 3, 5)", "rgb(255, 255, 255)"),
("gis", "rgb(30, 30, 30)", "rgb(173, 180, 183)", "rgb(255, 198, 65)", "rgb(255, 255, 255)");