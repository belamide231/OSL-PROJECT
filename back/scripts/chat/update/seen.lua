--[[

{
    existing_in_db: string,
    chat_type: enum('Not found', 'Updated')
}

]]--

redis.register_function('chat_update_seen', function (keys, args)
    local chat_id = tonumber(keys[1])
    local user_id = tostring(keys[2])
    local stamp = tostring(args[1])

    local chat_status_key = string.format('chat:%d:status', chat_id)
    local list_of_member = redis.call('LRANGE', chat_status_key, 0, -1)

    for index, element in pairs(list_of_member) do

        local object = cjson.decode(element)
        if(object.user_id == user_id) then
            object.user_seen_stamp = stamp
            redis.call('LSET', chat_status_key, index - 1, cjson.encode(object))
            return 'Updated'
        end
    end

    return 'Not found'
end)