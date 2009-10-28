module Service
  class LastFm
    require 'lib/memcache'
    require 'uri'

    ApiUrl = "http://ws.audioscrobbler.com/2.0/"
    class NotFoundException < StandardError; end

    def initialize (api_key, method = "")
      @api_key = api_key
      @method = method
      @query = {
        :api_key => @api_key,
        :format => "json",
      }
    end
    def method (method)
      @method = method
    end
    def params (params)
      @query.merge!(params)
      return self
    end
    def redirect_uri
      query_string = Rack::Utils::build_query(@query)
      uri = URI(ApiUrl)
      uri.query = query_string
      uri.to_s
    end
    def get
      case @method
      when "artist.getInfo"
        if artist = LastFmArtist.get_unexpired(@query["artist"])
          return '{"artist":{"name":"' + artist.name + '","image":' + artist.image + ',"cached_by_listenin_now":true}}'
        end
      when "user.getTopArtists"
        if user_top_artists = LastFmUserTopArtists.get_unexpired(@query["user"])
          return user_top_artists.data
        end
      end
      raise NotFoundException, "not found, #{@method}: #{@query.inspect}"
    end
    private

    def get_from_memcache(query)
      build_query query
      #sort by query.key, クエリの順番が変わってもヒットするように
      @key = Marshal.dump(@query.to_a.sort{|a,b| a[0].to_s <=> b[0].to_s})
      handler = Proc.new {|i|fetch i}
      response = Memcache.new.get_or_set @key, &handler
    end
    def fetch memcache
      #fix me, create a base urlfetch class?
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
end
