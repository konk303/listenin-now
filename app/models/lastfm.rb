require 'lib/memcache'
require 'uri'
class LastFm
  Net::HTTP = AppEngine::URLFetch::HTTP
  def initialize (api_key)
    @memcache = Memcache.new
    @api_url = "http://ws.audioscrobbler.com/2.0/"
    @api_key = api_key
  end
  def get(query)
    case @query["method"]
      when "user.getRecentTracks"
      ttl = 60*5 #5 minutes
      else
      ttl = 60*60*24*7 #1 week
    end
    handler = Proc.new {fetch}
    response = @memcache.get_or_set @query, ttl, &handler
  end
  def normalize_query query
    @query = {
      :api_key => @api_key,
      :format => "json",
    }.merge(query)
  end
  def build_target_url query
    normalize_query query
    # build query string, do I need to do this by myself?
    query_string = @query.
      map{|i| i.join("=")}.join("&")
    @target_url = URI(@api_url)
    @target_url.query = query_string
    @target_url
  end
  def fetch
    #fix me, create a base urlfetch class?
    require 'appengine-apis/urlfetch'
    Net::HTTP.start(@target_url.host, @target_url.port) do |http|
      return http.get(@target_url.request_uri)
    end
  end
end
