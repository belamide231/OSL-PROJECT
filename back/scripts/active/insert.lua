
-- string

redis.register_function('active_insert', function(keys, args)

    local key = tostring(keys[1])
    local user_id = tostring(args[1])
    local users_ids_list = redis.call('LRANGE', key, 0, -1)

    for _, element in pairs(users_ids_list) do
        if tostring(element) == user_id then
            return 'exist'
        end
    end

    redis.call('LPUSH', key, user_id)
    return 'inserted'
end)