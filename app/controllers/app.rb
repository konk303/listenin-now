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
      halt '{"artist":{"name":"' + artist.name + '","image":' + artist.image + ',"cached_by_listenin_now":true}}'
    end
  when "user.getTopArtists"
    if user_top_artists = LastFmUserTopArtists.get_unexpired(params[:user])
      content_type 'application/json'
      halt user_top_artists.data
    end
  end
  redirect url.to_s, 302
end

post '/api/artist' do
  artist = LastFmArtist.first_or_create(:name => params[:artist])
  artist.update(
                :image => params[:image],
                :container => params[:container],
                :updater_id => params[:updater_id],
                :updater_name => params[:updater_name]
                )
  content_type 'application/json'
  JSON.generate({:status => "ok"})
end

post '/api/user_topArtist' do
  user_top_artists = LastFmUserTopArtists.first_or_create(:user => params[:user])
  user_top_artists.attributes = {
    :artists => [],
    :container => params[:container],
    :updater_id => params[:updater_id],
    :updater_name => params[:updater_name]
  }
  parsed_data = JSON.parse(params[:data])
  #flag cached
  parsed_data['topartists'][:cached_by_listenin_now] = true
  user_top_artists.data = JSON.generate(parsed_data)
  # also update artists with info inside user.topArtist
  parsed_data['topartists']["artist"].each do |data|
    # fix me. better use has_many relations when dm-appengine supported it.
    user_top_artists.artists << data["name"]
    artist = LastFmArtist.first_or_create(:name => data["name"])
    artist.update(
                  :image => JSON.generate(data["image"]),
                  :container => params[:container],
                  :updater_id => params[:updater_id],
                  :updater_name => params[:updater_name]
                  )
  end
  user_top_artists.save
  content_type 'application/json'
  JSON.generate({:status => "ok"})
end

get '/api/amazon' do
end
