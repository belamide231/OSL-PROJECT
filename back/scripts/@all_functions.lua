#!lua name=myLib
--! metadata {"version":"1.0.0","engine":"LUA","description":"."}

redis.register_function('set_names', function(_, args)

    local objects = cjson.decode(args[1])

    for _, object in ipairs(objects) do
        redis.call('SET', string.format('chats:users:%d:name', object.id), object.name, 'EX', 60 * 60)
    end

end)

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

redis.register_function('get_chat', function (_, args)

    local chat = redis.call('LRANGE', tostring(args[1]), 0, -1)
    local messages = {}

    for _, message in ipairs(chat) do

        local object_message = cjson.decode(message)
        table.insert(messages, object_message)
    end

    return cjson.encode({ messages })
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

redis.register_function('get_message', function (_, args)

    local chat_key = redis.call('GET', string.format('chats:participants:%d:%d', tostring(args[1]), tostring(args[2])))
    local messages = redis.call('LRANGE', chat_key, '0', '-1')

    for _, value in ipairs(messages) do

        local message = cjson.decode(value)
        if(message.id == tonumber(args[3])) then
            return value
        end
    end
end)

redis.register_function('get_messages', function (_, args)

    local user_id = tonumber(args[1])
    local chatmate_id = tonumber(args[2])
    local offset = tonumber(args[3])
    local messages = {}

    if not user_id then
        return 'Invalid user_id'
    elseif not chatmate_id then
        return 'Invalid chatmate_id'
    elseif not offset then
        return 'Invalid offset'
    end

    local chat_key = redis.call('GET', string.format('chats:participants:%d:%d', user_id, chatmate_id))
    if not chat_key then
        return nil
    end

    local messages_status = {
        user = {
            content_status = '',
            sent_at = nil,
            delivered_at = nil,
            seen_at = nil
        },
        chatmate = {
            content_status = '',
            sent_at = nil,
            delivered_at = nil,
            seen_at = nil
        }
    }

    local length = redis.call('LLEN', chat_key)
    if offset > length then
        return nil
    end

    local chatmate_name = redis.call('GET', string.format('chats:users:%d:name', chatmate_id))

    local message_length = 0
    while message_length ~= 15 do

        local stringified_message = redis.call('LRANGE', chat_key, offset, offset)
        if #stringified_message ~= 1 then
            break
        end

        message_length = message_length + 1
        local object_message = cjson.decode(stringified_message[1])

        object_message.chatmate = chatmate_name

        if object_message.sender_id == chatmate_id then
            object_message.sender = chatmate_name
        else
            object_message.receiver = chatmate_name
        end

        table.insert(messages, object_message)
        offset = offset + 1
    end

    local index = length - 1
    while messages_status.user.content_status == '' and messages_status.chatmate.content_status == '' do

        local stringified_message = redis.call('LRANGE', chat_key, index, index)
        if #stringified_message == 0 then
            break
        end

        local json_message = cjson.decode(stringified_message[1])

        if json_message.sender_id == user_id then
            messages_status.user.content_status = json_message.content_status
            messages_status.user.sent_at = json_message.sent_at
            messages_status.user.delivered_at = json_message.delivered_at
            messages_status.user.seen_at = json_message.seen_at
        else
            messages_status.chatmate.content_status = json_message.content_status
            messages_status.chatmate.sent_at = json_message.sent_at
            messages_status.chatmate.delivered_at = json_message.delivered_at
            messages_status.chatmate.seen_at = json_message.seen_at
        end

        index = index - 1
    end

    return cjson.encode({ messages = messages, length = message_length, messages_status = messages_status })
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

redis.register_function('update_chat_to_delivered', function (_, args)

    local seener = tonumber(args[1])
    local sender = tonumber(args[2])
    local stringified_stamp = tostring(args[3])
    local updated = false
    local counter = 0

    local chat_key = redis.call('GET', string.format('chats:participants:%d:%d', seener, sender))
    if not chat_key then
        return updated
    end

    while true do

        local stringified_message = redis.call('LRANGE', chat_key, counter, counter)
        if #stringified_message == 0 then
            break
        end

        local object_message = cjson.decode(stringified_message[1])
        if object_message.content_status == 'delivered' or object_message.content_status == 'seen' then
            break
        end

        if object_message.sender_id ~= seener then

            object_message.content_status = 'delivered'
            object_message.delivered_at = stringified_stamp

            stringified_message = cjson.encode(object_message)
            redis.call('LSET', chat_key, counter, stringified_message)

            if updated == false then
                updated = true
            end

        end

        counter = counter + 1
    end

    return updated
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

            if object_message.sender_id ~= user then

                object_message.content_status = 'delivered'
                redis.call('LSET', chat_key, message_search_index, cjson.encode(object_message))    

                if updated == false then
                    updated = true
                    table.insert(chatmates_to_notify, tonumber(chatmates[1]))
                end

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

redis.register_function('delete_chat', function(_, args)

    local data = cjson.decode(args[1])

    redis.call('DEL', data.chatKey)

    redis.call('DEL', string.format('chats:participants:%d:%d', data.users[1], data.users[2]))
    redis.call('DEL', string.format('chats:participants:%d:%d', data.users[2], data.users[1]))

    redis.call('LREM', string.format('chats:users:%d:chatlist', data.users[1]), 1, data.users[2])
    redis.call('LREM', string.format('chats:users:%d:chatlist', data.users[2]), 1, data.users[1])
end)