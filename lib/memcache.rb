require 'appengine-apis/memcache'
class Memcache < AppEngine::Memcache
  def get_or_set (param, time)
#    key = Marshal.dump(param)
    #sort by param.key to make the key
    key = Marshal.dump(param.to_a.sort{|a,b| a[0].to_s <=> b[0].to_s})
    val = self[key]
    Log.warn time
    if val
      Log.warn 'hit!'
      val
    else
      Log.warn 'miss!'
      response = yield
      if response.code == "200"
        set(key, response, time)
      end
      response
    end
  end
  def log_stat
    Log.warn stats.inspect
  end
end
