redis.register_function('delete_chat', function(_, args)

    local data = cjson.decode(args[1])

    redis.call('DEL', data.chatKey)

    redis.call('DEL', string.format('chats:participants:%d:%d', data.users[1], data.users[2]))
    redis.call('DEL', string.format('chats:participants:%d:%d', data.users[2], data.users[1]))

    redis.call('LREM', string.format('chats:users:%d:chatlist', data.users[1]), 1, data.users[2])
    redis.call('LREM', string.format('chats:users:%d:chatlist', data.users[2]), 1, data.users[1])
end)