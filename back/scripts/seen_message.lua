redis.register_function('seen_message', function (_, args)

    local user_id = tonumber(args[1])
    local chatmate_id = tonumber(args[2])
    local stamp = tostring(args[3])

    local chat_key = redis.call('GET', string.format('chats:participants:%d:%d', user_id, chatmate_id))
    if chat_key == nil then
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

        message.content_status = 'seen'
        message.seen_at = stamp

        redis.call('LSET', chat_key, counter, cjson.encode(message))

        updated = true
        counter = counter + 1
    end

    if updated then
        return chatmate_id
    else
        return nil
    end
end)
