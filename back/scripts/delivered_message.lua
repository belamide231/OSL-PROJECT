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