#!lua name=myLib
redis.register_function('getMessage', function (key, args)    

    -- uid is UserId
    -- cid is ChatmateId

    local uid = tostring(args[1])

    local cids = redis.call('LRANGE', string.format('chats:user:%d:chatlist', uid), 0, -1)
    local results = {}

    for _, cid in ipairs(cids) do

        local chatId = redis.call('GET', string.format('chats:participants:%d:%d', uid, cid))
        local chat = redis.call('LRANGE', chatId, 0, -1)
       
        table.insert(results, chat)

    end

    return results

end)