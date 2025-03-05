#!lua name=myLib
--! metadata {"version":"1.0.0","engine":"LUA","description":"."}

redis.register_function('set_message', function (_, args)

    local message = cjson.decode(tostring(args[1]))
    local sender_id = message.sender_id
    local receiver_id = message.receiver_id

    local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', sender_id, receiver_id))

    if chat_id == false then
        chat_id = string.format("chats:chat:%d", redis.call('INCR', 'chats:identifiers:chat'))

        redis.call('SET', string.format('chats:participants:%d:%d', sender_id, receiver_id), chat_id)
        redis.call('SET', string.format('chats:participants:%d:%d', receiver_id, sender_id), chat_id)
    end

    message.id = redis.call('INCR', 'chats:identifiers:message')
    redis.call('LPUSH', chat_id, cjson.encode(message))

    redis.call('LREM', string.format('chats:users:%d:chatlist', sender_id), 1, receiver_id)
    redis.call('LPUSH', string.format('chats:users:%d:chatlist', sender_id), receiver_id)

    redis.call('LREM', string.format('chats:users:%d:chatlist', receiver_id), 1, sender_id)
    redis.call('LPUSH', string.format('chats:users:%d:chatlist', receiver_id), sender_id)

    return { message.id, chat_id }
end)

redis.register_function('get_message', function (_, args)

    local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', tostring(args[1]), tostring(args[2])))
    local messages = redis.call('LRANGE', chat_id, '0', '-1')

    for _, value in ipairs(messages) do

        local message = cjson.decode(value)
        if(message.id == tonumber(args[3])) then
            return value
        end
    end
end)

redis.register_function('get_chats', function (_, args)

    local user_id = tostring(args[1])
    local chatmates_ids = redis.call('LRANGE', string.format('chats:users:%d:chatlist', user_id), 0, -1)
    local result = {}

    for _, chatmate_id in ipairs(chatmates_ids) do

        local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', user_id, chatmate_id))
        local chat = redis.call('LRANGE', chat_id, 0, 0)

        if #chat > 0 then

            local chat_head = cjson.decode(chat[1])
            local chatmate = redis.call('GET', string.format('chats:users:%d:name', chatmate_id))

            chat_head.chatmate_id = tonumber(chatmate_id)
            chat_head.chatmate = chatmate

            if chat_head.sender_id == chatmates_ids then
                chat_head.sender = chatmate
            else
                chat_head.receiver = chatmate
            end

            table.insert(result, { chat_head })
        end
    end

    if #result > 0 then
        return cjson.encode(result)
    else
        return {}
    end
end)

redis.register_function('set_names', function(_, args)

    local objects = cjson.decode(args[1])

    for _, object in ipairs(objects) do
        redis.call('SET', string.format('chats:users:%d:name', object.id), object.name, 'EX', 60 * 60)
    end

end)

redis.register_function('delete_chat', function(_, args)

    local data = cjson.decode(args[1])

    redis.call('DEL', data.chatKey)

    redis.call('DEL', string.format('chats:participants:%d:%d', data.users[1], data.users[2]))
    redis.call('DEL', string.format('chats:participants:%d:%d', data.users[2], data.users[1]))

    redis.call('LREM', string.format('chats:users:%d:chatlist', data.users[1]), 1, data.users[2])
    redis.call('LREM', string.format('chats:users:%d:chatlist', data.users[2]), 1, data.users[1])
end)

redis.register_function('get_chat', function (_, args)

    local chat = redis.call('LRANGE', tostring(args[1]), 0, -1)
    local messages = {}

    for _, message in ipairs(chat) do

        local object_message = cjson.decode(message)
        table.insert(messages, object_message)
    end

    return cjson.encode({ messages })
end)

redis.register_function('delivered_message', function (_, args)

    local user = tonumber(args[1])
    local chatmates_key = string.format('chats:users:%d:chatlist', user)

    if redis.call('EXISTS', chatmates_key) == 0 then
        return
    end

    local chatmates_to_notify = {}
    local chatmate_search_index = 0

    while true do

        local chatmates = redis.call('LRANGE', chatmates_key, chatmate_search_index, chatmate_search_index)
        if #chatmates == 0 then
            break
        end

        local chat_key = redis.call('GET', string.format('chats:participants:%d:%d', user, chatmates[1]))
        if chat_key == nil then
            break
        end

        local updated = false

        local message_search_index = 0
        while true do

            local stringified_messages = redis.call('LRANGE', chat_key, message_search_index, message_search_index)

            if #stringified_messages == 0 then
                break
            end

            local object_message = cjson.decode(stringified_messages[1])
            if object_message.content_status == 'delivered' or object_message.content_status == 'seen' then
                break
            end

            object_message.content_status = 'delivered'
            redis.call('LSET', chat_key, message_search_index, cjson.encode(object_message))

            if updated == false then
                updated = true
                table.insert(chatmates_to_notify, tonumber(chatmates[1]))
            end

            message_search_index = message_search_index + 1
        end

        chatmate_search_index = chatmate_search_index + 1
    end

    if #chatmates_to_notify == 0 then
        return {}
    else
        return chatmates_to_notify
    end
end)

redis.register_function('seen_message', function (_, args)

    local user_id = tonumber(args[1])
    local chatmate_id = tonumber(args[2])
    local stamp = tostring(args[3])

    local chat_key = redis.call('GET', string.format('chats:participants:%d:%d', user_id, chatmate_id))
    if chat_key == nil or chat_key == false then
        return nil
    end

    local updated = false
    local counter = 0

    while true do

        local messages = redis.call('LRANGE', chat_key, counter, counter)
        if #messages == 0 then
            break
        end

        local message = cjson.decode(messages[1])
        if message.content_status == 'seen' then
            break
        end

        if message.delivered_at == nil then
            message.delivered_at = stamp
        end

        if updated == false then
            updated = true
        end

        message.content_status = 'seen'
        message.seen_at = stamp

        redis.call('LSET', chat_key, counter, cjson.encode(message))

        counter = counter + 1
    end

    if updated then
        return chatmate_id
    else
        return nil
    end
end)