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

    if redis.call('EXISTS', string.format('chat:%d:status', chat_id)) == 0 then
        return cjson.null
    end

    local recepient = {
        status = {
            chat_id = chat_id,
            member_status = {}
        },
        recepients_connections = {}
    }

    for index, member in pairs(redis.call('LRANGE', string.format('chat:%d:status', chat_id), 0, -1)) do

        member = cjson.decode(member)
        if user_id == member.member_id then

            member.member_message_seen_stamp = stamp
            recepient.status.member_status = member

            redis.call('LSET', string.format('chat:%d:status', chat_id), index - 1, cjson.encode(member))
        end

        for _, connection in pairs(redis.call('LRANGE', string.format('specific_user:%s:connections', member.member_id), 0, -1)) do
            table.insert(recepient.recepients_connections, connection)
        end
    end

    return cjson.encode(recepient)
end)