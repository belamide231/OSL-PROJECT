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
    local is_recepient_customer = tostring(args[2])
    local recepients_connections = {}

    if new_message_object.chat_id == cjson.null then

        new_message_object.chat_id  = redis.call('INCR', 'id_generator:chat')
        existing_in_db = false;
    end

    if redis.call('EXISTS', string.format('chat:%d:status', new_message_object.chat_id)) == 0 then

        redis.call('SET', string.format('chat:%d:is_recepient_customer', new_message_object.chat_id), is_recepient_customer)
        for _, member_id in pairs(list_member_id) do

            local member = member_id
            if redis.call('EXISTS', string.format('user_information:%s', member_id) ) == 1 then
                local str = redis.call('GET', string.format('user_information:%s', member_id) )
                local information = cjson.decode(str)
                member = tostring(information.name)
            end

            redis.call('LPUSH', string.format('chat:%d:status', new_message_object.chat_id), cjson.encode({

                member = member,
                member_id = member_id,
                member_message_delivered_stamp = cjson.null,
                member_message_seen_stamp = cjson.null
            }))
        end
    end

    new_message_object.message_id = redis.call('INCR', 'id_generator:message')

    for _, member_id in pairs(list_member_id) do
        redis.call('LREM', string.format('specific_user:%s:chat_list', member_id), 0, new_message_object.chat_id)
        redis.call('LPUSH', string.format('specific_user:%s:chat_list', member_id), new_message_object.chat_id)
    end

    redis.call('LPUSH', string.format('chat:%d:messages', new_message_object.chat_id), cjson.encode(new_message_object))

    for _, member in pairs(redis.call('LRANGE', string.format('chat:%d:status', new_message_object.chat_id), 0, -1)) do
        for _, connection in pairs(redis.call('LRANGE', string.format('specific_user:%s:connections', cjson.decode(member).member_id), 0, -1)) do
            table.insert(recepients_connections, connection)
        end
    end

    return cjson.encode({
        existing_in_db = existing_in_db,
        new_message_object = new_message_object,
        recepients_connections = recepients_connections
    })
end)

-- string[]
redis.register_function('chats_update_delivered', function (keys, args)

    local user_id = tostring(keys[1])
    local stamp = tostring(args[1])
    local recepients = {}
    local chats = {}

    if redis.call('EXISTS', string.format('specific_user:%s:chat_list', user_id)) == 0 then
        return cjson.null
    end

    for _, chat in pairs(redis.call('LRANGE', string.format('specific_user:%s:chat_list', user_id), 0, -1)) do

        local message = cjson.decode( redis.call('LRANGE', string.format('chat:%d:messages', tonumber(chat)), 0, 0)[1] )
        local recepients_connections = {}

        for member_index, member in pairs(redis.call('LRANGE', string.format('chat:%d:status', chat), 0, -1)) do

            member = cjson.decode(member)
            if user_id == member.member_id and (member.member_message_delivered_stamp == cjson.null or tostring(member.member_message_delivered_stamp) < tostring(message.sent_at)) then

                member.member_message_delivered_stamp = stamp

                table.insert(chats, chat)
                table.insert(recepients, {
                    status = {
                        chat_id = chat,
                        member_status = member,
                    },
                    recepients_connections = recepients_connections
                })

                redis.call('LSET', string.format('chat:%d:status', chat), member_index - 1, cjson.encode(member))
            end

            for _, connection in pairs(redis.call('LRANGE', string.format('specific_user:%s:connections', member.member_id), 0, -1)) do
                table.insert(recepients_connections, connection)
            end
        end
    end

    if #recepients == 0 then
        return cjson.null
    end

    return cjson.encode({ recepients = recepients, chats = chats })
end)

redis.register_function('chat_update_delivered', function(keys, args)
    local chat_id = tonumber(keys[1])
    local user_id = tostring(keys[2])
    local stamp = tostring(args[1])

    if redis.call('EXISTS', string.format('chat:%d:status', chat_id)) == 0 then
        return cjson.null
    end

    local recepients = {
        status = {
            chat_id = chat_id,
            member_status = {},
        },
        recepients_connections = {}
    }

    for index, member in pairs( redis.call('LRANGE', string.format('chat:%d:status', chat_id), 0, -1) ) do

        member = cjson.decode(member)
        if user_id == member.member_id then

            member.member_message_delivered_stamp = stamp
            recepients.status.member_status = member

            redis.call('LSET', string.format('chat:%d:status', chat_id), index - 1, cjson.encode(member))
        end

        for _, connection in pairs( redis.call('LRANGE', string.format('specific_user:%s:connections', member.member_id), 0, -1) ) do

            table.insert(recepients.recepients_connections, connection)
        end
    end

    return cjson.encode(recepients)
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

    if redis.call('EXISTS', string.format('chat:%d:status', chat_id)) == 0 then
        return cjson.null
    end

    local recepient = {
        status = {
            chat_id = chat_id,
            member_status = {}
        },
        recepients_connections = {}
    }

    for index, member in pairs(redis.call('LRANGE', string.format('chat:%d:status', chat_id), 0, -1)) do

        member = cjson.decode(member)
        if user_id == member.member_id then

            member.member_message_seen_stamp = stamp
            recepient.status.member_status = member

            redis.call('LSET', string.format('chat:%d:status', chat_id), index - 1, cjson.encode(member))
        end

        for _, connection in pairs(redis.call('LRANGE', string.format('specific_user:%s:connections', member.member_id), 0, -1)) do
            table.insert(recepient.recepients_connections, connection)
        end
    end

    return cjson.encode(recepient)
end)

redis.register_function('chat_get_chats', function (keys, args)
    local user_id = tostring(keys[1])               -- '20210090-qwerty'
    local offset = tonumber(args[1])                -- '0'
    local limit = tonumber(args[2])                 -- '15'

    local object = {
        RedisChats = {},
        offset = offset,
        limit = limit,
        exceptions = {}
    }

    local chat_length = redis.call('LLEN', string.format('specific_user:%s:chat_list', user_id))
    if offset > chat_length then
        object.offset = offset - chat_length
        object.limit = limit
        return cjson.encode(object)
    end

    local chat_id_list = redis.call('LRANGE', string.format('specific_user:%s:chat_list', user_id), offset, offset + (limit -1))

    for index, chat_id in pairs(chat_id_list) do

        table.insert(object.exceptions, chat_id)

        object.RedisChats[index] = {
            Messages = {},
            Status = {}
        }

        local first_element_message_list = redis.call('LRANGE', string.format('chat:%d:messages', chat_id), 0, 0)
        table.insert(object.RedisChats[index].Messages, cjson.decode(first_element_message_list[1]))

        local member_status_list = redis.call('LRANGE', string.format('chat:%d:status', chat_id), 0, -1)
        for _, member_status in pairs(member_status_list) do
            table.insert(object.RedisChats[index].Status, cjson.decode(member_status))
        end

        if index == limit then
            object.offset = cjson.null
            object.limit = 0
            return cjson.encode(object)
        end
    end

    object.offset = 0
    object.limit = limit - #object.RedisChats
    return cjson.encode(object)
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

redis.register_function('chat_get_chat', function (keys, _)
    local chat_status_key = string.format('chat:%d:status', keys[1])
    local chat_messages_key = string.format('chat:%d:messages', keys[1])
    local is_recepient_customer_key = string.format('chat:%d:is_recepient_customer', keys[1])

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

    redis.call('DEL', chat_status_key, chat_messages_key, is_recepient_customer_key)
    for _, member in pairs(chat_status_object) do
        local specific_user = string.format('specific_user:%s:chat_list', member.member_id)
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