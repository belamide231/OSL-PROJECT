# TASKS
----------------------------------------------------------------------------------------------------------------
# deliver-message       : WORKING

LOCATIONS
OSL-PROJECT\back\src\configuration\redis.ts
OSL-PROJECT\back\src\sockets\connection.ts
    FUNCTION(message delivered)
OSL-PROJECT\back\src\sockets\message.ts
    FUNCTION(messageDelivered)
OSL-PROJECT\back\src\services\messageServices.ts
    FUNCTION(deliveredChatService)
OSL-PROJECT\back\scripts\delivered_message.lua

----------------------------------------------------------------------------------------------------------------
# PROBLEM        | WORKING       | messageServices.ts  <-- BUGS -->

receiveMessage naay bugs
----------------------------------------------------------------------------------------------------------------
# WORK           | PENDING       | load-messages
# WORK           | PENDING       | seen-message
----------------------------------------------------------------------------------------------------------------