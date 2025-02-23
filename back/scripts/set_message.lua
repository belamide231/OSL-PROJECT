redis.register_function('set_message', function (_, args)

    local message = cjson.decode(tostring(args[1]))
    local user_id = message.senderId
    local mate_id = message.receiverId

    local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', user_id, mate_id))

    if chat_id == false then
        chat_id = string.format("chats:chat:%d", redis.call('INCR', 'chats:identifiers:chat'))

        redis.call('SET', string.format('chats:participants:%d:%d', user_id, mate_id), chat_id)
        redis.call('SET', string.format('chats:participants:%d:%d', mate_id, user_id), chat_id)
    end

    message.messageId = redis.call('INCR', 'chats:identifiers:message')
    redis.call('LPUSH', chat_id, cjson.encode(message))

    -- QUEUENG
    redis.call('LREM', string.format('chats:user:%d:chatlist', user_id), 1, mate_id)
    redis.call('LPUSH', string.format('chats:user:%d:chatlist', user_id), mate_id)

    redis.call('LREM', string.format('chats:user:%d:chatlist', mate_id), 1, user_id)
    redis.call('LPUSH', string.format('chats:user:%d:chatlist', mate_id), user_id)

    return { message.messageId, chat_id }
end)