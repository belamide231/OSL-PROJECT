-- string[]
redis.register_function('chat_update_delivered', function (keys, args)

    local user_id = tostring(keys[1])
    local stamp = tostring(args[1])
    local recepient_list = {}

    local user_chat_id_list = string.format('specific_user:%s:chat_list', user_id)
    local chat_list = redis.call('LRANGE', user_chat_id_list, 0, -1)

    for _, chat_id in pairs(chat_list) do

        local chat_status_key = string.format('chat:%d:status', chat_id)
        local member_list = redis.call('LRANGE', chat_status_key, 0, -1)

        for index, member_status_string in pairs(member_list) do

            local member_status = cjson.decode(member_status_string)
            if user_id == member_status.user_id then

                member_status.user_delivered_stamp = stamp
                redis.call('LSET', chat_status_key, index - 1, cjson.encode(member_status))
                table.insert(recepient_list, chat_id)

                break
            end
        end
    end

    return recepient_list
end)