#!lua name=myLib
--! metadata {"version":"1.0.0","engine":"LUA","description":"."}

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

-- string[]
redis.register_function('chat_update_delivered', function (keys, args)

    local user_id = tostring(keys[1])
    local stamp = tostring(args[1])
    local recepient_list = {}

    local user_chat_id_list = string.format('specific_user:%s:chat_list', user_id)
    local chat_list = redis.call('LRANGE', user_chat_id_list, 0, -1)

    for _, chat_id in pairs(chat_list) do

        local chat_status_key = string.format('chat:%d:status', chat_id)
        local member_list = redis.call('LRANGE', chat_status_key, 0, -1)

        for index, member_status_string in pairs(member_list) do

            local member_status = cjson.decode(member_status_string)
            if user_id == member_status.user_id then

                member_status.user_delivered_stamp = stamp
                redis.call('LSET', chat_status_key, index - 1, cjson.encode(member_status))
                table.insert(recepient_list, chat_id)

                break
            end
        end
    end

    return recepient_list
end)

--[[

{
    existing_in_db: string,
    chat_type: enum('Not found', 'Updated')
}

]]--

redis.register_function('chat_update_seen', function (keys, args)
    local chat_id = tonumber(keys[1])
    local user_id = tostring(keys[2])
    local stamp = tostring(args[1])

    local chat_status_key = string.format('chat:%d:status', chat_id)
    local list_of_member = redis.call('LRANGE', chat_status_key, 0, -1)

    for index, element in pairs(list_of_member) do

        local object = cjson.decode(element)
        if(object.user_id == user_id) then
            object.user_seen_stamp = stamp
            redis.call('LSET', chat_status_key, index - 1, cjson.encode(object))
            return 'Updated'
        end
    end

    return 'Not found'
end)

--[[

{
    status_list: { 
        user_id:                   string,
        user_delivered_stamp:      string,
        user_seen_stamp:           string
    }, 
    message_list: {
        sender_id: string,
        message: string,
        message_type": enum('text', 'file'),
        message_id: number,
        chat_id: number,
        sent_at: string
    }
}

--]]

redis.register_function('chat_get', function (keys, _)
    local chat_status_key = string.format('chat:%d:status', keys[1])
    local chat_messages_key = string.format('chat:%d:messages', keys[1])

    local chat_status_string = redis.call('LRANGE', chat_status_key, 0, -1)
    local chat_messages_string = redis.call('LRANGE', chat_messages_key, 0, -1)

    local chat_status_object = {}
    local chat_messages_object = {}

    for _, status in pairs(chat_status_string) do
        table.insert(chat_status_object, cjson.decode(status))
    end

    for _, message in pairs(chat_messages_string) do
        table.insert(chat_messages_object, cjson.decode(message))
    end

    redis.call('DEL', chat_status_key, chat_messages_key)
    for _, member in pairs(chat_status_object) do
        local specific_user = string.format('specific_user:%s:chat_list', member.user_id)
        redis.call('LREM', specific_user, 0, tonumber(keys[1]))
    end

    return cjson.encode({
        status_list = chat_status_object,
        message_list = chat_messages_object
    })
end)

-- string

redis.register_function('active_insert', function(keys, args)

    local key = tostring(keys[1])
    local user_id = tostring(args[1])
    local users_ids_list = redis.call('LRANGE', key, 0, -1)

    for _, element in pairs(users_ids_list) do
        if tostring(element) == user_id then
            return 'exist'
        end
    end

    redis.call('LPUSH', key, user_id)
    return 'inserted'
end)