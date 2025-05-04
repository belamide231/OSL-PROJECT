-- string[]
redis.register_function('chats_update_delivered', function (keys, args)

    local user_id = tostring(keys[1])
    local stamp = tostring(args[1])
    local recepients = {}
    local chats = {}

    if redis.call('EXISTS', string.format('specific_user:%s:chat_list', user_id)) == 0 then
        return cjson.null
    end

    for _, chat in pairs(redis.call('LRANGE', string.format('specific_user:%s:chat_list', user_id), 0, -1)) do

        local message = cjson.decode( redis.call('LRANGE', string.format('chat:%d:messages', tonumber(chat)), 0, 0)[1] )
        local recepients_connections = {}

        for member_index, member in pairs(redis.call('LRANGE', string.format('chat:%d:status', chat), 0, -1)) do

            member = cjson.decode(member)
            if user_id == member.member_id and (member.member_message_delivered_stamp == cjson.null or tostring(member.member_message_delivered_stamp) < tostring(message.sent_at)) then

                member.member_message_delivered_stamp = stamp

                table.insert(chats, chat)
                table.insert(recepients, {
                    status = {
                        chat_id = chat,
                        member_status = member,
                    },
                    recepients_connections = recepients_connections
                })

                redis.call('LSET', string.format('chat:%d:status', chat), member_index - 1, cjson.encode(member))
            end

            for _, connection in pairs(redis.call('LRANGE', string.format('specific_user:%s:connections', member.member_id), 0, -1)) do
                table.insert(recepients_connections, connection)
            end
        end
    end

    if #recepients == 0 then
        return cjson.null
    end

    return cjson.encode({ recepients = recepients, chats = chats })
end)