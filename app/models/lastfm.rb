require 'lib/memcache'
require 'uri'
class LastFm
  Net::HTTP = AppEngine::URLFetch::HTTP
  def initialize (api_key)
    @api_url = "http://ws.audioscrobbler.com/2.0/"
    @api_key = api_key
  end
  def get(query)
    build_query query
    #sort by query.key, クエリの順番が変わってもヒットするように
    @key = Marshal.dump(@query.to_a.sort{|a,b| a[0].to_s <=> b[0].to_s})
    handler = Proc.new {|i|fetch i}
    response = Memcache.new.get_or_set @key, &handler
  end
  def build_query query
    @query = {
      :api_key => @api_key,
      :format => "json",
    }.merge(query)
  end
  def build_target_uri
    # build query string, do I need to do this by myself?
    query_string = @query.
      map{|i| i.join("=")}.join("&")
    uri = URI(@api_url)
    uri.query = query_string
    uri
  end
  def fetch memcache
    #fix me, create a base urlfetch class?
    require 'appengine-apis/urlfetch'
    @target_uri = build_target_uri
    res = nil
    Net::HTTP.start(@target_uri.host, @target_uri.port) do |http|
      res = http.get(@target_uri.request_uri)
    end
    ret = {
      :content_type => res.content_type,
      :charset => res.type_params['charset'],
      :code => res.code,
      :body => res.body,
    }
    if res.code == '200'
      case @query["method"]
      when "user.getRecentTracks"
        ttl = Time.new + 60*5 #5 minutes
      else
        ttl = Time.new + 60*60*24*7 #1 week
      end
      Log.warn memcache.set(@key, ret, ttl)
    end
    ret
  end
end
