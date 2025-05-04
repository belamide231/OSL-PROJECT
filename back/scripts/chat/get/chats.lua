redis.register_function('chat_get_chats', function (keys, args)
    local user_id = tostring(keys[1])               -- '20210090-qwerty'
    local offset = tonumber(args[1])                -- '0'
    local limit = tonumber(args[2])                 -- '15'

    local object = {
        RedisChats = {},
        offset = offset,
        limit = limit,
        exceptions = {}
    }

    local chat_length = redis.call('LLEN', string.format('specific_user:%s:chat_list', user_id))
    if offset > chat_length then
        object.offset = offset - chat_length
        object.limit = limit
        return cjson.encode(object)
    end

    local chat_id_list = redis.call('LRANGE', string.format('specific_user:%s:chat_list', user_id), offset, offset + (limit -1))

    for index, chat_id in pairs(chat_id_list) do

        table.insert(object.exceptions, chat_id)

        object.RedisChats[index] = {
            Messages = {},
            Status = {}
        }

        local first_element_message_list = redis.call('LRANGE', string.format('chat:%d:messages', chat_id), 0, 0)
        table.insert(object.RedisChats[index].Messages, cjson.decode(first_element_message_list[1]))

        local member_status_list = redis.call('LRANGE', string.format('chat:%d:status', chat_id), 0, -1)
        for _, member_status in pairs(member_status_list) do
            table.insert(object.RedisChats[index].Status, cjson.decode(member_status))
        end

        if index == limit then
            object.offset = cjson.null
            object.limit = 0
            return cjson.encode(object)
        end
    end

    object.offset = 0
    object.limit = limit - #object.RedisChats
    return cjson.encode(object)
end)