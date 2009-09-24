require 'appengine-apis/memcache'
class Memcache < AppEngine::Memcache
  def get_or_set (key)
    val = self[key]
    if val
      Log.warn 'hit!'
      val
    else
      Log.warn 'miss!'
      yield(self)
    end
  end
  def log_stat
    Log.warn stats.inspect
  end
end
