redis.register_function('delivered_message', function (_, args)

    local uid = tostring(args[1])
    local cids = args[2]
    local stamp = tostring(args[4])
    local toNotify = {}
    local exists = 0

    for _, cid in ipairs(cids) do

        local chatId = redis.call('GET', string.format('chats:participants:%d:%d', uid, cid))
        if chatId == false then
            goto end_first_loop
        end

        local messages = redis.call('LRANGE', chatId, '0', '-1')
        if messages == 0 then
            goto end_first_loop
        end

        for i, msg in ipairs(messages) do

            local message = cjson.decode(msg)
            if message.content_status ~= 'sent' then
                goto end_second_loop
            end

            message.content_status = 'delivered'
            message.delivered_at = stamp
            redis.call('LSET', chatId, i-1, cjson.encode(message))

            if exists == 0 then
                table.insert(toNotify, cid)
                exists = 1
            end

            ::end_second_loop::
        end

        ::end_first_loop::

        exists = 0
    end
end)