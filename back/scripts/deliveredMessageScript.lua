#!lua name=myLib
redis.register_function('deliveredMessage', function (key, args)
    
    local uid = tostring(args[1])
    local cids = args[2]
    local stamp = tostring(args[3])


end)