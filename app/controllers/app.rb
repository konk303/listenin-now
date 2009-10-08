get '/xml/listenin-now.xml' do
  content_type 'application/xml', :charset => 'utf-8'
  builder :'app/ln'
end

get '/api/lastfm' do
#   response = LastFm.new(options.last_fm['api_key']).get(params)
#   content_type response[:content_type], :charset => response[:charset]
#   status response[:code]
#   response[:body]
  #memcache doesn't expire as I expected. use redirect
  lastfm = LastFm.new(options.last_fm['api_key'])
  lastfm.build_query(params)
  url = lastfm.build_target_uri

  # should be moved to last.fm class
  case params[:method]
  when "artist.getInfo"
    if artist = LastFmArtist.get_unexpired(params[:artist])
      content_type 'application/json'
      halt ActiveSupport::JSON.encode({:artist => {
                                          :name => artist.name,
                                          :image => artist.images.map{|i| Marshal.load(i)},
                                          :cached_by_listenin_now => true,
                                        }})
    end
  end
  redirect url.to_s, 302
end

post '/api/artist' do
  artist = LastFmArtist.first_or_create(:name => params[:artist])
  artist.update(
                :images =>
                ActiveSupport::JSON.decode(params[:image]).map{|i| Marshal.dump(i)},
                :container => params[:container],
                :updater_id => params[:updater_id],
                :updater_name => params[:updater_name]
                )
  content_type 'application/json'
  ActiveSupport::JSON.encode({:status => "ok"})
end

get '/api/amazon' do
end
