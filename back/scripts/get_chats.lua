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