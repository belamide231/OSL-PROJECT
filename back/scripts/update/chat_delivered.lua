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
            break;
        end

        object_message.content_status = 'delivered'
        object_message.delivered_at = stringified_stamp

        stringified_message = cjson.encode(object_message)
        redis.call('LSET', chat_key, counter, stringified_message)

        if updated == false then
            updated = true
        end

        counter = counter + 1
    end

    return updated
end)