redis.register_function('get_chat', function (_, args)

    local chat = redis.call('LRANGE', tostring(args[1]), 0, -1)
    local messages = {}

    for _, message in ipairs(chat) do

        local object_message = cjson.decode(message)
        table.insert(messages, object_message)
    end

    return cjson.encode({ messages })
end)