NOTE: 1.
# PAG KUHA SA BAG-O NGA MESSAGE
Ang pamaagi sa pagkuha nato sa atong bag-ong messages, kay mo check na sa redis, then sa mysql


NOTE: 2.
# MIGRATIONS FROM CACHING TO DB REQUIREMENTS
If ever mag pa load tag messages, check apon nato daan if unsay value sa status nga reversed cached data, wither seen or delivered, if poros sent dita mag edit ug data sa db, pero if seen or delivered, ara ta mag edit, so atong goal, dapat mag puno tag parameter sa atong load messages aron tig check sa status.


NOTE: 3.
# DATA PASSING
So sa atong api, instead mag hatag tag 15 ka messages every chat sa pinaka unang query, ang tanan hatagan natog 1 lang kabuok, if ever kinsa toy naa sa index 0, automatic man mo load ang mga messages, since ang clientHeight exceeded na daan sa.
