require 'rubygems'
require 'sinatra'
require 'haml'
require 'yaml'
require 'activesupport'
require 'builder'
require 'appengine-apis/logger'
require 'appengine-apis/urlfetch'
require 'appengine-apis/users'
require 'dm-core'
# Load all ruby files in app/models
Dir.glob(::File.join(%w[app models ** *.rb])).each {|fn|require fn}
# datastore lang patch
require 'lib/datastore_patch'

#configure
configure do
  #gae logger
  Log = AppEngine::Logger.new
  Log.level = AppEngine::Logger::DEBUG
  #data-mapper
  DataMapper.setup(:default, "appengine://auto")
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
  #haml options
  set :haml, { :format => :html5}
end

configure :development do
  @config['development'].each {|key,val| set key.to_sym => val}
  #reloading, http://groups.google.com/group/appengine-jruby/browse_thread/thread/dbf5cb3c9b7e3ff6/04ba4409cfc9c8b4?lnk=gst&q=shotgun#04ba4409cfc9c8b4
  require 'lib/reloader'
  use Sinatra::Reloader
  use Sinatra::ShowExceptions
end

configure :production do
  @config['production'].each {|key,val| set key.to_sym => val}
end



#helpers
helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end



#before filter
before do
  @body_id = request.path_info.split('/')[1] || 'index'
  @page_title = " - mixiアプリ「リスニンなう」"
  @description = "opensocial gadget / mixiアプリ 「リスニンなう」の紹介です。"
#  p @admin, request.path_info, options.environment
end



#controllers

#for maintenance
#load 'app/controllers/maintenance.rb'

#url optimize
load 'app/controllers/url_optimize.rb'

#app urls
load 'app/controllers/app.rb'

#sitemap
load 'app/controllers/xml.rb'

#updates
load 'app/controllers/updates.rb'

#admin
load 'app/controllers/admin.rb'

get '/' do
  @page_title[0,0] = "listenin' now"
  haml @body_id.intern
end

get '/help' do
  @page_title[0,0] = "ヘルプ"
  haml @body_id.intern
end

get '/demo' do
  @page_title[0,0] = "デモ"
  haml @body_id.intern
end

get '/feedback' do
  @page_title[0,0] = "フィードバック"
  haml @body_id.intern
end

get '/tech' do
  @page_title[0,0] = "技術情報"
  haml @body_id.intern
end

get '/author' do
  @page_title[0,0] = "作者について"
  haml @body_id.intern
end
