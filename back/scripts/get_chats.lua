redis.register_function('get_chats', function (_, args)

    local user_id = tostring(args[1])

    local chatmates_ids = redis.call('LRANGE', string.format('chats:users:%d:chatlist', user_id), 0, -1)

    local result = {}

    for _, chatmate_id in ipairs(chatmates_ids) do

        local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', user_id, chatmate_id))
        local chat_head = redis.call('LRANGE', chat_id, 0, 0)

        table.insert(result, { cjson.decode(chat_head[1]) })

    end

    return cjson.encode(result)

end)