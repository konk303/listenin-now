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
  redirect url.to_s, 302
end

get '/api/amazon' do
end
