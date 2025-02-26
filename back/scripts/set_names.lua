redis.register_function('set_names', function(_, args)

    local objects = cjson.decode(args[1])

    for _, object in ipairs(objects) do
        redis.call('SET', string.format('chats:users:%d:name', object.id), object.name, 'EX', 60 * 60)
    end

end)