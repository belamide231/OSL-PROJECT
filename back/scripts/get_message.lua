redis.register_function('get_message', function (_, args)

    local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', tostring(args[1]), tostring(args[2])))
    local messages = redis.call('LRANGE', chat_id, '0', '-1')

    for _, value in ipairs(messages) do

        local message = cjson.decode(value)
        if(message.id == tonumber(args[3])) then
            return value
        end
    end
end)