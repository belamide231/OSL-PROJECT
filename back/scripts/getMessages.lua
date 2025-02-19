#!lua name=myLib
redis.register_function('getMessages', function(keys, args)
    local messages = redis.call('LRANGE', 'db:messages', 0, -1)
    local userId = tonumber(args[1])
    local chatmateId = tonumber(args[2])
    local found = 0
    local result = {}
  
    for _, msg in ipairs(messages) do
        local message = cjson.decode(msg)
        if (message.senderId == userId and message.receiverId == chatmateId) 
        or (message.senderId == chatmateId and message.receiverId == userId) 
        then
            table.insert(result, msg)
            found = found + 1
        end
    end
  
    return { found, result }
end)
  