require 'lib/memcache'
class LastFm
  Net::HTTP = AppEngine::URLFetch::HTTP
  def initialize (api_key)
    @memcache = Memcache.new
    @api_url = "http://ws.audioscrobbler.com/2.0/"
    @api_key = api_key
  end
  def get(query)
    @query = {
      :api_key => @api_key,
      :format => "json",
    }.merge(query)
    case @query["method"]
      when "user.getRecentTracks"
      ttl = Time.new + 60*5 #5 minutes
      else
      ttl = Time.new + 60*60*24*7 #1 week
    end
    handler = Proc.new {fetch}
    response = @memcache.get_or_set @query, ttl, &handler
  end
  def fetch
    #fix me, create a base urlfetch class?
    require 'appengine-apis/urlfetch'
    require 'uri'
    # build query string, do I need to do this by myself?
    query_string = @query.
      map{|i| i.join("=")}.join("&")
    url = URI(@api_url)
    url.query = query_string
    Net::HTTP.start(url.host, url.port) do |http|
      return http.get(url.request_uri)
    end
  end
end
