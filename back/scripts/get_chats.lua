redis.register_function('get_chats', function (_, args)

    local user_id = tostring(args[1])
    local chatmates_ids = redis.call('LRANGE', string.format('chats:user:%d:chatlist', user_id), 0, -1)
    local results = {}

    for _, chatmate_id in ipairs(chatmates_ids) do

        local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', user_id, chatmate_id))
        local chat = redis.call('LRANGE', chat_id, 0, -1)

        table.insert(results, chat)

    end

    return results

end)