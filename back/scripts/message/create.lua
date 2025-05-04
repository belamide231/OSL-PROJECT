
-- @Object Interface
-- {
--     existing_in_db: boolean,
--     chat_type: enum('chat_authorize_messages', 'chat_customer_messages'),
--     new_message_object:         {
--         message_id:                   number
--         chat_id:                      number,
--         sender_id:                    string,
--         sent_at:                      string,
--         message_type:                 enum('text' | 'file'),
--         message:                      string
--     }
-- }

redis.register_function('create_message', function (keys, args)
    local existing_in_db = true;
    local list_member_id = cjson.decode(keys[1])
    local new_message_object = cjson.decode(args[1])
    local is_recepient_customer = tostring(args[2])
    local recepients_connections = {}

    if new_message_object.chat_id == cjson.null then

        new_message_object.chat_id  = redis.call('INCR', 'id_generator:chat')
        existing_in_db = false;
    end

    if redis.call('EXISTS', string.format('chat:%d:status', new_message_object.chat_id)) == 0 then

        redis.call('SET', string.format('chat:%d:is_recepient_customer', new_message_object.chat_id), is_recepient_customer)
        for _, member_id in pairs(list_member_id) do

            local member = member_id
            if redis.call('EXISTS', string.format('user_information:%s', member_id) ) == 1 then
                local str = redis.call('GET', string.format('user_information:%s', member_id) )
                local information = cjson.decode(str)
                member = tostring(information.name)
            end

            redis.call('LPUSH', string.format('chat:%d:status', new_message_object.chat_id), cjson.encode({

                member = member,
                member_id = member_id,
                member_message_delivered_stamp = cjson.null,
                member_message_seen_stamp = cjson.null
            }))
        end
    end

    new_message_object.message_id = redis.call('INCR', 'id_generator:message')

    for _, member_id in pairs(list_member_id) do
        redis.call('LREM', string.format('specific_user:%s:chat_list', member_id), 0, new_message_object.chat_id)
        redis.call('LPUSH', string.format('specific_user:%s:chat_list', member_id), new_message_object.chat_id)
    end

    redis.call('LPUSH', string.format('chat:%d:messages', new_message_object.chat_id), cjson.encode(new_message_object))

    for _, member in pairs(redis.call('LRANGE', string.format('chat:%d:status', new_message_object.chat_id), 0, -1)) do
        for _, connection in pairs(redis.call('LRANGE', string.format('specific_user:%s:connections', cjson.decode(member).member_id), 0, -1)) do
            table.insert(recepients_connections, connection)
        end
    end

    return cjson.encode({
        existing_in_db = existing_in_db,
        new_message_object = new_message_object,
        recepients_connections = recepients_connections
    })
end)