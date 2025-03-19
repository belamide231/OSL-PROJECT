redis.register_function('set_message', function (_, args)

    local message = cjson.decode(tostring(args[1]))
    local sender_id = message.sender_id
    local receiver_id = message.receiver_id

    local chat_id = redis.call('GET', string.format('chats:participants:%d:%d', sender_id, receiver_id))

    if chat_id == false then
        chat_id = string.format("chats:chat:%d", redis.call('INCR', 'chats:identifiers:chat'))

        redis.call('SET', string.format('chats:participants:%d:%d', sender_id, receiver_id), chat_id)
        redis.call('SET', string.format('chats:participants:%d:%d', receiver_id, sender_id), chat_id)
    end

    message.id = redis.call('INCR', 'chats:identifiers:message')
    redis.call('LPUSH', chat_id, cjson.encode(message))

    redis.call('LREM', string.format('chats:users:%d:chatlist', sender_id), 1, receiver_id)
    redis.call('LPUSH', string.format('chats:users:%d:chatlist', sender_id), receiver_id)

    redis.call('LREM', string.format('chats:users:%d:chatlist', receiver_id), 1, sender_id)
    redis.call('LPUSH', string.format('chats:users:%d:chatlist', receiver_id), sender_id)

    return { message.id, chat_id }
end)