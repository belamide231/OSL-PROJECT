redis.register_function('seen_message', function (_, args)

    local uid = tostring(args[1])
    local cid = tostring(args[2])
    local stamp = tostring(args[3])
    local toNotify = 0

    local chatId = redis.call('GET', string.format('chats:participants:%d:%d', uid, cid))
    if chatId == false then
        return nil
    end

    local messages = redis.call('LRANGE', chatId, '0', '-1')
    if messages == 0 then
        return nil
    end

    for i, msg in ipairs(messages) do

        local message = cjson.decode(msg)
        if message.content_status ~= 'seen' then
            goto end_loop
        end

        if toNotify == 0 then
            toNotify = tonumber(cid)
        end

        message.content_status = 'seen'
        message.delivered_at = stamp
        redis.call('LSET', chatId, i-1, cjson.encode(message))

        ::end_loop::
    end

    -- RETURNS AN ARRAY

    if toNotify == 0 then
        return nil
    else
        return toNotify
    end
end)