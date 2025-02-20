#!lua name=myLib
redis.register_function('setMessage', function (key, args)

    -- uid is UserId
    -- cid is ChatmateId

    local uid = tostring(args[1])
    local cid = tostring(args[2])
    local obj = tostring(args[3])

    local chatId = redis.call('GET', string.format('chats:participants:%d:%d', uid, cid))

    if chatId == false then
        chatId = string.format("chats:chat:%d", redis.call('INCR', 'chats:identifier'))

        redis.call('SET', string.format('chats:participants:%d:%d', uid, cid), chatId)
        redis.call('SET', string.format('chats:participants:%d:%d', cid, uid), chatId)
    end

    redis.call('LPUSH', chatId, obj)

    redis.call('LREM', string.format('chats:user:%d:chatlist', uid), 1, cid)
    redis.call('LPUSH', string.format('chats:user:%d:chatlist', uid), cid)

    redis.call('LREM', string.format('chats:user:%d:chatlist', cid), 1, uid)
    redis.call('LPUSH', string.format('chats:user:%d:chatlist', cid), uid)

end)