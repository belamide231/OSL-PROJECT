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