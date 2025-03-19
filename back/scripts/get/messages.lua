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