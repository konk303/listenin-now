require 'rubygems'
require 'sinatra'
require 'haml'
require 'yaml'
require 'builder'
require 'appengine-apis/logger'



#configure
configure do
  #gae logger
  Log = AppEngine::Logger.new
  Log.level = AppEngine::Logger::DEBUG
  #set config from yaml
  @config = ConfigFile.instance.config
  @config['common'].each {|key,val| set key.to_sym => val}
  #locations
  set :app_file => __FILE__
  #logs can be retrieved from gae
  disable :logging
  #static files are served from gae static options
  disable :static
#   disable :dump_errors
end

configure :development do
  @config_from_file['development'].each {|key,val| set key.to_sym => val}
#reloading, http://groups.google.com/group/appengine-jruby/browse_thread/thread/dbf5cb3c9b7e3ff6/04ba4409cfc9c8b4?lnk=gst&q=shotgun#04ba4409cfc9c8b4
  require 'lib/reloader'
  use Sinatra::Reloader
  use Sinatra::ShowExceptions
end

configure :production do
  @config_from_file['production'].each {|key,val| set key.to_sym => val}
end



#before filter
before do
#  Log.warn [options.environment,options.last_fm['api_key']].join(", ")
end



#controllers
get '/' do
  hoge = "hoge"
  haml '%h1 Hello, world! #{:hoge} env:#{options.root}', :locals => {:hoge => hoge}
end

get '/api/lastfm' do
  require 'app/models/lastfm'
  response = LastFm.new(options.last_fm['api_key']).get(params)
  content_type response.content_type, :charset => response.type_params['charset']
  status response.code
  response.body
end

get '/api/amazon' do
end

get '/xml/listenin-now.xml' do
  content_type 'application/xml', :charset => 'utf-8'
  builder :ln
end

get '/admin/:path' do
  #auth処理
  p params[:path]
  if 'cron/memcache_stat'
    Memcache.new.log_stat
  end
end

get '/hi/:name' do
  haml '%h1 Hello, #{params[:name]}!'
end
