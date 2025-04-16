
-- @Object Interface
-- {
--     existing_in_db: boolean,
--     chat_type: enum('chat_authorize_messages', 'chat_customer_messages'),
--     new_message_object:         {
--         message_id:                   number
--         chat_id:                      number,
--         sender_id:                    string,
--         sent_at:                      string,
--         message_type:                 enum('text' | 'file'),
--         message:                      string
--     }
-- }

redis.register_function('create_message', function (keys, args)

    local existing_in_db = true;
    local list_member_id = cjson.decode(keys[1])

    local new_message_object = cjson.decode(args[1])

    if new_message_object.chat_id == cjson.null then

        new_message_object.chat_id  = redis.call('INCR', 'id_generator:chat')
        existing_in_db = false;
    end

    local chat_status_key = string.format('chat:%d:status', new_message_object.chat_id)
    if redis.call('EXISTS', chat_status_key) == 0 then
        for _, member_id in pairs(list_member_id) do
            local chat_status_key = string.format('chat:%d:status', new_message_object.chat_id)
            redis.call('LPUSH', chat_status_key, cjson.encode({
                user_id = member_id,
                user_delivered_stamp = cjson.null,
                user_seen_stamp = cjson.null
            }))
        end
    end

    new_message_object.message_id = redis.call('INCR', 'id_generator:message')

    for _, member_id in pairs(list_member_id) do
        local member_chat_list = string.format('specific_user:%s:chat_list', member_id);
        redis.call('LREM', member_chat_list, 0, new_message_object.chat_id)
        redis.call('LPUSH', member_chat_list, new_message_object.chat_id)
    end
    
    local chat_messages_key = string.format('chat:%d:messages', new_message_object.chat_id)
    redis.call('LPUSH', chat_messages_key, cjson.encode(new_message_object))

    return cjson.encode({
        existing_in_db = existing_in_db,
        new_message_object = new_message_object,
    })

end)